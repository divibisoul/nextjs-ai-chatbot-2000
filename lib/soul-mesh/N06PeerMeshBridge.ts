import { randomUUID } from 'node:crypto';

export type NucleusId = 'N01' | 'N02' | 'N03' | 'N04' | 'N05' | 'N06';
export type MeshEnvelope = { protocol:'soul-mesh/1'; id:string; correlationId:string; traceId:string; source:NucleusId; target:NucleusId; kind:'request'|'response'|'event'|'error'; capability:string; payload:unknown; timestamp:number; nonce:string; transport:'http' };
export type PeerState = { url:string; healthy:boolean; failures:number; latencyMs:number|null; openedUntil:number };
const PEERS: readonly NucleusId[] = ['N01','N02','N03','N04','N05'];
const envKey = (peer:NucleusId) => `SOUL_MESH_${peer}_URL`;
const normalize = (url:string) => url.replace(/\/+$/, '');
const sleep = (ms:number) => new Promise((r) => setTimeout(r, ms));

export class N06PeerMeshBridge {
  private readonly peers = new Map<NucleusId, PeerState>();
  private readonly timeoutMs:number;
  private readonly retries:number;
  constructor(options:{timeoutMs?:number; retries?:number; peers?:Partial<Record<NucleusId,string>>} = {}) {
    this.timeoutMs = options.timeoutMs ?? Number(process.env.SOUL_MESH_TIMEOUT_MS ?? 30000);
    this.retries = options.retries ?? Number(process.env.SOUL_MESH_RETRIES ?? 2);
    for (const peer of PEERS) { const url = options.peers?.[peer] ?? process.env[envKey(peer)]; if (url) this.peers.set(peer,{url:normalize(url),healthy:false,failures:0,latencyMs:null,openedUntil:0}); }
  }
  configuredPeers(){ return [...this.peers.keys()]; }
  private endpoint(peer:NucleusId){ const state=this.peers.get(peer); if(!state) throw new Error(`SOUL_MESH_${peer}_URL is required`); return `${state.url}${state.url.endsWith('/mesh/in')?'':'/mesh/in'}`; }
  private async post(peer:NucleusId,envelope:MeshEnvelope){
    const state=this.peers.get(peer); if(!state) throw new Error(`PEER_NOT_CONFIGURED:${peer}`); if(state.openedUntil>Date.now()) throw new Error(`PEER_CIRCUIT_OPEN:${peer}`);
    let last:unknown;
    for(let attempt=0;attempt<=this.retries;attempt++){
      const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),this.timeoutMs); const started=Date.now();
      try{
        const response=await fetch(this.endpoint(peer),{method:'POST',headers:{'content-type':'application/json','x-soul-nucleus':'N06','x-soul-target':peer,'x-correlation-id':envelope.correlationId,traceparent:`00-${envelope.traceId.replaceAll('-','').slice(0,32).padEnd(32,'0')}-${envelope.id.replaceAll('-','').slice(0,16).padEnd(16,'0')}-01`},body:JSON.stringify(envelope),signal:controller.signal});
        const text=await response.text(); let payload:unknown=text; try{payload=text?JSON.parse(text):null;}catch{}
        if(!response.ok) throw new Error(`HTTP_${response.status}`); state.healthy=true; state.failures=0; state.latencyMs=Date.now()-started; return {peer,payload,status:response.status,latencyMs:state.latencyMs,attempt};
      }catch(error){last=error;state.failures+=1;state.healthy=false;if(state.failures>=5)state.openedUntil=Date.now()+60000;if(attempt<this.retries)await sleep(150*(2**attempt)+Math.floor(Math.random()*100));}finally{clearTimeout(timer);}
    }
    throw last instanceof Error?last:new Error(`PEER_REQUEST_FAILED:${peer}`);
  }
  async request(peer:Exclude<NucleusId,'N06'>,capability:string,payload:unknown,correlationId=randomUUID(),traceId=randomUUID()){
    return this.post(peer,{protocol:'soul-mesh/1',id:randomUUID(),correlationId,traceId,source:'N06',target:peer,kind:'request',capability,payload,timestamp:Date.now(),nonce:randomUUID(),transport:'http'});
  }
  async health(peer:Exclude<NucleusId,'N06'>){const state=this.peers.get(peer);if(!state)return{peer,configured:false,healthy:false};const result=await this.request(peer,'mesh.health',{nucleus:'N06'});return{peer,configured:true,healthy:true,latencyMs:result.latencyMs};}
  async broadcast(capability:string,payload:unknown){return Promise.allSettled(PEERS.filter(p=>this.peers.has(p)).map(peer=>this.request(peer,capability,payload)));}
  async combo(steps:readonly {target:Exclude<NucleusId,'N06'>;capability:string;payload?:unknown}[]){const correlationId=randomUUID(),traceId=randomUUID();let value:unknown=null;const results:unknown[]=[];for(const step of steps){const result=await this.request(step.target,step.capability,step.payload??value,correlationId,traceId);value=result.payload;results.push(result);}return{correlationId,traceId,results,final:value};}
}
export const n06PeerMeshBridge=new N06PeerMeshBridge();
