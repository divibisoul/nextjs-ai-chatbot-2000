import crypto, { createHmac, timingSafeEqual } from 'node:crypto';
import type { SoulMeshMessage, SoulNucleus } from './SoulMeshProtocol';
import { createSoulMeshMessage, validateSoulMeshMessage } from './SoulMeshProtocol';
import { createSoulMeshNonce, signSoulMeshMessage, verifySoulMeshResponse } from './SoulMeshHmac';

export type N06Peer=Exclude<SoulNucleus,'N06'>;
/**
 * Runtime boundary for N06 peer execution.
 * N01-N07 are executable Mesh peers through the canonical `/api/soul-mesh` route.
 * N07 responses use the legacy Go Mesh HMAC envelope and are verified against that wire contract.
 */
const ACTIVE_PEERS:readonly N06Peer[]=['N01','N02','N03','N04','N05','N07'];
const STRUCTURAL_PEERS:readonly N06Peer[]=[];
export const N06_ACTIVE_PEERS=ACTIVE_PEERS;
export const N06_STRUCTURAL_PEERS=STRUCTURAL_PEERS;
export const N06_ALL_PEERS:readonly N06Peer[]=[...ACTIVE_PEERS,...STRUCTURAL_PEERS];
const ENV:Record<N06Peer,string>={N01:'SOUL_MESH_N01_URL',N02:'SOUL_MESH_N02_URL',N03:'SOUL_MESH_N03_URL',N04:'SOUL_MESH_N04_URL',N05:'SOUL_MESH_N05_URL',N07:'SOUL_MESH_N07_URL'};
const DEFAULT_TIMEOUT=15000, MAX_TIMEOUT=60000, MAX_RETRIES=2;
function timeout(ms:number){return Math.min(MAX_TIMEOUT,Math.max(1000,Math.floor(ms)));}
function meshSecret(){return (process.env.SOUL_MESH_HMAC_SECRET??'').trim()||(process.env.SOUL_MESH_SECRET??'').trim();}
const RETRY_SAFE_CAPABILITIES=new Set(['mesh.ping','mesh.describe','mesh.health','capability.list','sara.health','sara.state','sara.capabilities','sara.trace','external.federation.describe@1.0.0','superagi.fabric.describe@1.0.0','cooperation.health@1.0.0']);
function retryableFailure(error:unknown){const message=error instanceof Error?error.message:String(error);return /N06_MESH_HTTP_(429|5\d\d)|fetch failed|ECONNRESET|ECONNREFUSED|EAI_AGAIN|AbortError|timed? ?out|network/i.test(message)&&!/HMAC|AUTH|INVALID|REPLAY|CORRELATION/i.test(message);}
function sortGoMaps(value:unknown):unknown{
 if(Array.isArray(value))return value.map(sortGoMaps);
 if(value&&typeof value==='object'){
  const source=value as Record<string,unknown>;const sorted:Record<string,unknown>={};
  for(const key of Object.keys(source).sort())sorted[key]=sortGoMaps(source[key]);
  return sorted;
 }
 return value;
}
/** Sign N07 requests in the exact field order and nested-map ordering used by Go encoding/json. */
function signN07Request(message:SoulMeshMessage,secret:string,nonce:string):string{
 const unsigned={
  protocol:message.protocol,contractVersion:message.contractVersion,id:message.id,correlationId:message.correlationId,
  source:message.source,target:message.target,kind:message.kind,capability:message.capability??'',
  payload:sortGoMaps(message.payload),timestamp:message.timestamp,
  transport:message.meta?.transport??null,meta:sortGoMaps(message.meta??null),nonce,
 };
 return createHmac('sha256',secret).update(JSON.stringify(unsigned),'utf8').digest('hex');
}
/** Verify the actual N07 Go response envelope (protocol.MeshEnvelope canonical bytes). */
export function verifyN07LegacyResponse(request:SoulMeshMessage,response:SoulMeshMessage,secret:string,now=Date.now()):boolean{
 const nonce=String(response.nonce??response.meta?.nonce??'').trim();const signature=String(response.hmac??'').trim();
 if(!secret||Buffer.byteLength(secret,'utf8')<32||!nonce||!/^[0-9a-f]{64}$/i.test(signature)||!Number.isFinite(response.timestamp)||Math.abs(now-response.timestamp)>30000)return false;
 if(response.source!=='N07'||response.target!=='N06'||request.target!=='N07'||response.correlationId!==request.correlationId||(response.kind!=='response'&&response.kind!=='error'))return false;
 const unsigned={version:'1.0',contractVersion:response.contractVersion,messageId:response.id,source:response.source,target:response.target,timestamp:response.timestamp,nonce,correlationId:response.correlationId,type:response.kind==='error'?'ERROR':'TASK_RESULT',payload:{capability:response.capability??request.capability??'',payload:sortGoMaps(response.payload??{})}};
 const expected=createHmac('sha256',secret).update(JSON.stringify(unsigned),'utf8').digest();const actual=Buffer.from(signature,'hex');return actual.length===expected.length&&timingSafeEqual(actual,expected);
}
export function getN06Peers(){return ACTIVE_PEERS.map(id=>({id,url:process.env[ENV[id]]?.trim().replace(/\/$/,'')??''}));}
export function getN06StructuralPeers(){return STRUCTURAL_PEERS.map(id=>({id,url:process.env[ENV[id]]?.trim().replace(/\/$/,'')??''}));}
export function createN06Request(target:N06Peer,capability:string,payload:unknown,correlationId:string=crypto.randomUUID(),traceId:string=correlationId):SoulMeshMessage{return createSoulMeshMessage({source:'N06',target,kind:'request',capability,payload,correlationId,transport:'HTTP',meta:{runtime:'nextjs-ai-chatbot-2000',transport:'HTTP',encoding:'json',version:'1.1.0',traceId}});}
export async function sendFromN06(
 target:N06Peer,capability:string,payload:unknown,timeoutMs=DEFAULT_TIMEOUT,correlationId:string=crypto.randomUUID(),traceId:string=correlationId,maxRetries=MAX_RETRIES,operationMessageId?:string,
):Promise<unknown>{
 const peer=getN06Peers().find(p=>p.id===target);
 if(!peer?.url)throw new Error(`N06_PEER_NOT_CONFIGURED:${target}`);
 if(!capability.trim())throw new Error('N06_CAPABILITY_REQUIRED');
 const secret=meshSecret();
 if(secret&&Buffer.byteLength(secret,'utf8')<32)throw new Error('SOUL_MESH_HMAC_SECRET_TOO_SHORT');
 if(!secret&&process.env.NODE_ENV==='production')throw new Error('SOUL_MESH_AUTH_NOT_CONFIGURED:N06');
 const message=createN06Request(target,capability,payload,correlationId,traceId);
 if(operationMessageId)message.id=operationMessageId;
 const canRetry=RETRY_SAFE_CAPABILITIES.has(capability);
 const requestedRetries=Number.isFinite(maxRetries)?Math.floor(maxRetries):0;
 const retries=canRetry?Math.max(0,Math.min(MAX_RETRIES,requestedRetries)):0;
 let last:unknown;
 for(let attempt=0;attempt<=retries;attempt++){
  const nonce=secret?createSoulMeshNonce():'';
  const meta={...(message.meta??{})};delete meta.nonce;if(nonce)meta.nonce=nonce;
  const attemptMessage:SoulMeshMessage={...message,timestamp:Date.now(),...(nonce?{nonce}:{}),meta};
  const headers:Record<string,string>={'content-type':'application/json',accept:'application/json','x-soul-correlation-id':attemptMessage.correlationId,'x-soul-trace-id':traceId};
  if(secret){headers['x-soul-mesh-nonce']=nonce;headers['x-soul-mesh-hmac']=target==='N07'?signN07Request(attemptMessage,secret,nonce):signSoulMeshMessage(attemptMessage,secret,nonce);}
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeout(timeoutMs));
  try{
   const endpoint=peer.url.endsWith('/api/soul-mesh')?peer.url:`${peer.url}/api/soul-mesh`;
   const response=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify(attemptMessage),cache:'no-store',signal:controller.signal});
   const raw:unknown=await response.json().catch(()=>null);
   if(!raw||typeof raw!=='object')throw new Error('N06_MESH_INVALID_RESPONSE_BODY');
   validateSoulMeshMessage(raw);
   const body=raw as SoulMeshMessage;
   if(secret){
    const authenticated=target==='N07'?verifyN07LegacyResponse(attemptMessage,body,secret):verifySoulMeshResponse(attemptMessage,body,secret);
    if(!authenticated)throw new Error(target==='N07'?'N06_N07_LEGACY_RESPONSE_HMAC_INVALID':'N06_MESH_RESPONSE_HMAC_INVALID');
   }
   if(body.correlationId!==attemptMessage.correlationId||body.source!==target||body.target!=='N06')throw new Error('N06_MESH_RESPONSE_INVALID');
   if(!response.ok){
    const statusError=new Error(`N06_MESH_HTTP_${response.status}`);last=statusError;
    if(attempt<retries&&retryableFailure(statusError)){await new Promise(r=>setTimeout(r,150*(2**attempt)));continue;}
    throw statusError;
   }
   if(body.kind==='error')throw new Error(`N06_REMOTE_ERROR:${target}`);
   return body.payload;
  }catch(error){
   last=error;
   if(attempt<retries&&retryableFailure(error)){await new Promise(r=>setTimeout(r,150*(2**attempt)));continue;}
   break;
  }finally{clearTimeout(timer);}
 }
 throw last instanceof Error?last:new Error(String(last??'N06_MESH_REQUEST_FAILED'));
}
export async function probeN06Peer(target:N06Peer){try{return{id:target,reachable:true,details:await sendFromN06(target,'mesh.describe',{from:'N06',protocol:'soul-mesh/1'})};}catch(error){return{id:target,reachable:false,error:error instanceof Error?error.message:String(error)};}}
export async function probeAllN06Peers(){return Promise.all(ACTIVE_PEERS.map(probeN06Peer));}

/** Structural N07 is never probed through the generic executable-peer path. */
export function describeN06StructuralPeers(){return STRUCTURAL_PEERS.map(id=>({id,url:process.env[ENV[id]]?.trim().replace(/\/$/,'')??'',execution:'structural-only' as const}));}