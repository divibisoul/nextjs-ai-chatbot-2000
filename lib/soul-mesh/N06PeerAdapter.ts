import crypto from 'node:crypto';
import type { SoulMeshMessage, SoulNucleus } from './SoulMeshProtocol';
import { createSoulMeshMessage, validateSoulMeshMessage } from './SoulMeshProtocol';

export type N06Peer=Exclude<SoulNucleus,'N06'>;
const PEERS:readonly N06Peer[]=['N01','N02','N03','N04','N05'];
const ENV:Record<N06Peer,string>={N01:'SOUL_MESH_N01_URL',N02:'SOUL_MESH_N02_URL',N03:'SOUL_MESH_N03_URL',N04:'SOUL_MESH_N04_URL',N05:'SOUL_MESH_N05_URL'};
const DEFAULT_TIMEOUT_MS=15000;
const MAX_TIMEOUT_MS=60000;
const MAX_RETRIES=2;
function timeout(ms:number){return Math.min(MAX_TIMEOUT_MS,Math.max(1000,Math.floor(ms)));}
export function getN06Peers(){return PEERS.map(id=>({id,url:process.env[ENV[id]]?.trim().replace(/\/$/,'')??''}));}
export function createN06Request(target:N06Peer,capability:string,payload:unknown):SoulMeshMessage{return createSoulMeshMessage({source:'N06',target,kind:'request',capability,correlationId:crypto.randomUUID(),payload,transport:'HTTP'});}
export async function sendFromN06(target:N06Peer,capability:string,payload:unknown,timeoutMs=DEFAULT_TIMEOUT_MS):Promise<unknown>{
 const peer=getN06Peers().find(p=>p.id===target);if(!peer?.url)throw new Error(`N06_PEER_NOT_CONFIGURED:${target}`);
 const message=createN06Request(target,capability,payload);let last:unknown;
 for(let attempt=0;attempt<=MAX_RETRIES;attempt++){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeout(timeoutMs));
  try{
   const response=await fetch(`${peer.url}/api/soul-mesh`,{method:'POST',headers:{'content-type':'application/json',accept:'application/json','x-soul-correlation-id':message.correlationId,...(process.env.SOUL_MESH_TOKEN?{authorization:`Bearer ${process.env.SOUL_MESH_TOKEN}`}:{})},body:JSON.stringify(message),cache:'no-store',signal:controller.signal});
   const raw:unknown=await response.json().catch(()=>null);
   if(!response.ok)throw new Error(`N06_MESH_HTTP_${response.status}`);
   validateSoulMeshMessage(raw);const body=raw as SoulMeshMessage;
   if(body.correlationId!==message.correlationId||body.source!==target||body.target!=='N06')throw new Error('N06_MESH_RESPONSE_INVALID');
   if(body.kind==='error')throw new Error(`N06_REMOTE_ERROR:${target}`);
   return body.payload;
  }catch(error){last=error;if(attempt<MAX_RETRIES)await new Promise(r=>setTimeout(r,250*(2**attempt)));}
  finally{clearTimeout(timer);}
 }
 throw last instanceof Error?last:new Error(String(last));
}
export async function probeN06Peer(target:N06Peer){try{return{id:target,reachable:true,details:await sendFromN06(target,'mesh.describe',{from:'N06',protocol: 'soul-mesh/1'})};}catch(error){return{id:target,reachable:false,error:error instanceof Error?error.message:String(error)};}}
export async function probeAllN06Peers(){return Promise.all(PEERS.map(probeN06Peer));}
