import crypto from 'node:crypto';
import type { SoulMeshMessage, SoulNucleus } from './SoulMeshProtocol';
import { createSoulMeshMessage, validateSoulMeshMessage } from './SoulMeshProtocol';
import { createSoulMeshNonce, signSoulMeshMessage } from './SoulMeshHmac';

export type N06Peer=Exclude<SoulNucleus,'N06'>;
/** N07 is now an active federated peer. Final fusion remains a separate commissioning stage. */
const ACTIVE_PEERS:readonly N06Peer[]=['N01','N02','N03','N04','N05','N07'];
const STRUCTURAL_PEERS:readonly N06Peer[]=['N01','N02','N03','N04','N05','N07'];
const ENV:Record<N06Peer,string>={N01:'SOUL_MESH_N01_URL',N02:'SOUL_MESH_N02_URL',N03:'SOUL_MESH_N03_URL',N04:'SOUL_MESH_N04_URL',N05:'SOUL_MESH_N05_URL',N07:'SOUL_MESH_N07_URL'};
const DEFAULT_TIMEOUT=15000, MAX_TIMEOUT=60000, MAX_RETRIES=2;
function timeout(ms:number){return Math.min(MAX_TIMEOUT,Math.max(1000,Math.floor(ms)));}
function meshSecret(){return (process.env.SOUL_MESH_HMAC_SECRET??process.env.SOUL_MESH_SECRET??'').trim();}
export function getN06Peers(){return ACTIVE_PEERS.map(id=>({id,url:process.env[ENV[id]]?.trim().replace(/\/$/,'')??''}));}
export function getN06StructuralPeers(){return STRUCTURAL_PEERS.map(id=>({id,url:process.env[ENV[id]]?.trim().replace(/\/$/,'')??''}));}
export function createN06Request(target:N06Peer,capability:string,payload:unknown,correlationId=crypto.randomUUID(),traceId=correlationId):SoulMeshMessage{return createSoulMeshMessage({source:'N06',target,kind:'request',capability,payload,correlationId,transport:'HTTP',meta:{runtime:'nextjs-ai-chatbot-2000',transport:'HTTP',encoding:'json',version:'1.1.0',traceId}});}
export async function sendFromN06(target:N06Peer,capability:string,payload:unknown,timeoutMs=DEFAULT_TIMEOUT,correlationId=crypto.randomUUID(),traceId=correlationId):Promise<unknown>{
 const peer=getN06Peers().find(p=>p.id===target);if(!peer?.url)throw new Error(`N06_PEER_NOT_CONFIGURED:${target}`);if(!capability.trim())throw new Error('N06_CAPABILITY_REQUIRED');
 const message=createN06Request(target,capability,payload,correlationId,traceId);let last:unknown;
 for(let attempt=0;attempt<=MAX_RETRIES;attempt++){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeout(timeoutMs));
  try{
   const secret=meshSecret();const headers:Record<string,string>={'content-type':'application/json',accept:'application/json','x-soul-correlation-id':message.correlationId,'x-soul-trace-id':traceId};
   if(secret){const nonce=createSoulMeshNonce();message.meta={...(message.meta??{}),nonce,traceId};headers['x-soul-mesh-nonce']=nonce;headers['x-soul-mesh-hmac']=signSoulMeshMessage(message,secret,nonce);}
   const response=await fetch(`${peer.url}/api/soul-mesh`,{method:'POST',headers,body:JSON.stringify(message),cache:'no-store',signal:controller.signal});
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
export async function probeN06Peer(target:N06Peer){try{return{id:target,reachable:true,details:await sendFromN06(target,'mesh.describe',{from:'N06',protocol:'soul-mesh/1'})};}catch(error){return{id:target,reachable:false,error:error instanceof Error?error.message:String(error)};}}
export async function probeAllN06Peers(){return Promise.all(ACTIVE_PEERS.map(probeN06Peer));}