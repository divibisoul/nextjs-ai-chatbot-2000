import { randomUUID } from 'node:crypto';
import type { SoulNucleus } from './SoulMeshProtocol';
import { sendFromN06 } from './N06PeerAdapter';

export type NucleusId = SoulNucleus;
export type MeshEnvelope = { protocol:'soul-mesh/1'; contractVersion:'1.1.0'; id:string; correlationId:string; source:'N06'; target:Exclude<NucleusId,'N06'>; kind:'request'|'response'|'event'|'error'; capability:string; payload:unknown; timestamp:number; meta?:{runtime?:string;transport?:string;encoding?:string;version?:string;nonce?:string;traceId?:string} };
export type PeerState = { url:string; healthy:boolean; failures:number; latencyMs:number|null; openedUntil:number };
const PEERS: readonly Exclude<NucleusId,'N06'>[] = ['N01','N02','N03','N04','N05','N07'];
const envKey = (peer:Exclude<NucleusId,'N06'>) => `SOUL_MESH_${peer}_URL`;
const DEFAULT_TIMEOUT_MS = 30000;
const MAX_TIMEOUT_MS = 60000;

export class N06PeerMeshBridge {
  private readonly peers = new Map<Exclude<NucleusId,'N06'>, PeerState>();
  private readonly retries:number;
  constructor(options:{retries?:number; peers?:Partial<Record<Exclude<NucleusId,'N06'>,string>>} = {}) {
    this.retries = Math.min(3, Math.max(0, Math.floor(options.retries ?? Number(process.env.SOUL_MESH_RETRIES ?? 2))));
    for (const peer of PEERS) {
      const url = options.peers?.[peer] ?? process.env[envKey(peer)];
      if (url) this.peers.set(peer,{url:url.replace(/\/+$/,''),healthy:false,failures:0,latencyMs:null,openedUntil:0});
    }
  }
  configuredPeers(){ return [...this.peers.keys()]; }

  async request(peer:Exclude<NucleusId,'N06'>,capability:string,payload:unknown,correlationId=randomUUID(),traceId=randomUUID()){
    const state=this.peers.get(peer);
    if (!state) throw new Error(`PEER_NOT_CONFIGURED:${peer}`);
    if (state.openedUntil>Date.now()) throw new Error(`PEER_CIRCUIT_OPEN:${peer}`);
    const started=Date.now(); let last:unknown;
    const timeoutMs=Math.min(MAX_TIMEOUT_MS,Math.max(1000,Math.floor(Number(process.env.SOUL_MESH_TIMEOUT_MS??DEFAULT_TIMEOUT_MS))));
    for(let attempt=0;attempt<=this.retries;attempt++){
      try{
        const result=await sendFromN06(peer,capability,payload,timeoutMs,correlationId,traceId);
        state.healthy=true;state.failures=0;state.latencyMs=Date.now()-started;state.openedUntil=0;
        return {peer,payload:result,status:200,latencyMs:state.latencyMs,attempt,correlationId,traceId};
      }catch(error){
        last=error;state.failures+=1;state.healthy=false;
        if(state.failures>=5)state.openedUntil=Date.now()+60000;
        if(attempt<this.retries)await new Promise(r=>setTimeout(r,150*(2**attempt)));
      }
    }
    throw last instanceof Error?last:new Error(`PEER_REQUEST_FAILED:${peer}`);
  }
  async health(peer:Exclude<NucleusId,'N06'>){const state=this.peers.get(peer);if(!state)return{peer,configured:false,healthy:false};const result=await this.request(peer,'mesh.health',{nucleus:'N06'});return{peer,configured:true,healthy:true,latencyMs:result.latencyMs};}
  async broadcast(capability:string,payload:unknown){return Promise.allSettled(PEERS.filter(p=>this.peers.has(p)&&this.peers.get(p)!.openedUntil<=Date.now()).map(peer=>this.request(peer,capability,payload)));}
  async combo(steps:readonly {target:Exclude<NucleusId,'N06'>;capability:string;payload?:unknown}[]){const correlationId=randomUUID(),traceId=randomUUID();let value:unknown=null;const results:unknown[]=[];for(const step of steps){const result=await this.request(step.target,step.capability,step.payload??value,correlationId,traceId);value=result.payload;results.push(result);}return{correlationId,traceId,results,final:value};}
}
export const n06PeerMeshBridge=new N06PeerMeshBridge();
