import crypto from 'node:crypto';
import type { SoulMeshMessage, SoulNucleus } from './SoulMeshProtocol';

export type N06Peer = Exclude<SoulNucleus, 'N06'>;
const PEERS: readonly N06Peer[] = ['N01','N02','N03','N04','N05'];
const ENV: Record<N06Peer,string> = { N01:'SOUL_MESH_N01_URL', N02:'SOUL_MESH_N02_URL', N03:'SOUL_MESH_N03_URL', N04:'SOUL_MESH_N04_URL', N05:'SOUL_MESH_N05_URL' };

export function getN06Peers() { return PEERS.map(id => ({ id, url: process.env[ENV[id]]?.trim().replace(/\/$/,'') ?? '' })); }
export function createN06Request(target:N06Peer, capability:string, payload:unknown):SoulMeshMessage { const id=crypto.randomUUID(); return { protocol:'soul-mesh/1', id, correlationId:id, source:'N06', target, kind:'request', capability, payload, timestamp:Date.now(), transport:'HTTP' }; }
export async function sendFromN06(target:N06Peer, capability:string, payload:unknown, timeoutMs=30000):Promise<unknown> { const peer=getN06Peers().find(p=>p.id===target); if(!peer?.url) throw new Error(`N06_PEER_NOT_CONFIGURED:${target}`); const message=createN06Request(target,capability,payload); const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),timeoutMs); try { const token=process.env.SOUL_MESH_TOKEN; const response=await fetch(`${peer.url}/api/soul-mesh`,{method:'POST',headers:{'content-type':'application/json',accept:'application/json',...(token?{authorization:`Bearer ${token}`}:{})},body:JSON.stringify(message),cache:'no-store',signal:controller.signal}); const body=await response.json().catch(()=>null) as SoulMeshMessage|null; if(!response.ok) throw new Error(`N06_MESH_HTTP_${response.status}`); if(!body||body.protocol!=='soul-mesh/1'||body.correlationId!==message.correlationId||body.source!==target||body.target!=='N06') throw new Error('N06_MESH_RESPONSE_INVALID'); if(body.kind==='error') throw new Error(`N06_REMOTE_ERROR:${target}`); return body.payload; } finally { clearTimeout(timer); } }
export async function probeN06Peer(target:N06Peer) { try { return {id:target,reachable:true,details:await sendFromN06(target,'mesh.describe',{from:'N06'})}; } catch(error) { return {id:target,reachable:false,error:error instanceof Error?error.message:String(error)}; } }
export async function probeAllN06Peers() { return Promise.all(PEERS.map(probeN06Peer)); }
