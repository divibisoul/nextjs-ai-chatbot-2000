import { NextResponse } from 'next/server';
import type { SoulMeshMessage } from '@/lib/soul-mesh/SoulMeshProtocol';
import { validateSoulMeshMessage } from '@/lib/soul-mesh/SoulMeshProtocol';
import { executeN06Capability, getN06Capabilities } from '@/lib/soul-mesh/N06CapabilityDispatcher';
import { N06AgentRegistry } from '@/lib/soul-mesh/N06AgentRegistry';
import { nucleus06Processor } from '@/lib/soul-core/N06Processor';
import { NUCLEUS_06_TOOL_IDS } from '@/lib/soul-core/Nucleus05ToolRegistry';
import { probeAllN06Peers } from '@/lib/soul-mesh/N06PeerAdapter';
import { verifySoulMeshMessage } from '@/lib/soul-mesh/SoulMeshHmac';

const NUCLEUS_ID='N06' as const;
const PEERS=['N01','N02','N03','N04','N05'] as const;
const MAX_PAYLOAD_BYTES=1024*1024;
const MAX_CLOCK_SKEW_MS=30_000;
const REPLAY_WINDOW_MS=5*60_000;
const RATE_LIMIT=100;
const RATE_WINDOW_MS=60_000;
const seenRequests=new Map<string,number>();
const peerBuckets=new Map<string,number[]>();
function secret(){return process.env.SOUL_MESH_HMAC_SECRET ?? '';}
function authorized(request:Request,message:SoulMeshMessage){
 const configured=secret();
 if(!configured)return process.env.NODE_ENV !== 'production';
 const nonce=request.headers.get('x-soul-mesh-nonce') ?? '';
 const hmac=request.headers.get('x-soul-mesh-hmac') ?? '';
 return verifySoulMeshMessage(message,configured,nonce,hmac);
}
function acceptOnce(id:string):boolean{const now=Date.now();for(const [key,t] of seenRequests)if(now-t>REPLAY_WINDOW_MS)seenRequests.delete(key);if(seenRequests.has(id))return false;seenRequests.set(id,now);return true;}
function rateAllowed(peer:string):boolean{const now=Date.now();const recent=(peerBuckets.get(peer)??[]).filter(t=>now-t<RATE_WINDOW_MS);if(recent.length>=RATE_LIMIT){peerBuckets.set(peer,recent);return false;}recent.push(now);peerBuckets.set(peer,recent);return true;}
function result(message:SoulMeshMessage,kind:'response'|'error',payload:unknown,status=200){return NextResponse.json({protocol:'soul-mesh/1',id:crypto.randomUUID(),correlationId:message.correlationId,source:NUCLEUS_ID,target:message.source,kind,capability:message.capability,payload,timestamp:Date.now(),transport:'HTTP'} satisfies SoulMeshMessage,{status});}
function createN06Agents(){const registry=new N06AgentRegistry();const executable=nucleus06Processor.executableCapabilities();registry.register({id:'N06-cognitive-agent',name:'N06 Cognitive Agent',capabilities:executable,execute:m=>executeN06Capability(m.capability!,m.payload)});registry.register({id:'N06-tool-agent',name:'N06 Tool Agent',capabilities:NUCLEUS_06_TOOL_IDS.map(id=>`tool:${id}`),execute:m=>executeN06Capability(m.capability!,m.payload)});registry.register({id:'N06-mesh-agent',name:'N06 Mesh Agent',capabilities:['mesh.ping','mesh.describe','mesh.discovery'],execute:async m=>m.capability==='mesh.ping'?{ok:true,nucleus:NUCLEUS_ID,processedAt:Date.now()}:m.capability==='mesh.discovery'?{nucleus:NUCLEUS_ID,peers:await probeAllN06Peers()}:{nucleus:NUCLEUS_ID,peers:[...PEERS],declaredCapabilities:getN06Capabilities(),executableCapabilities:executable,agents:registry.describe(),inChannels:PEERS.map(peer=>`N06.IN.${peer}`),outChannels:PEERS.map(peer=>`N06.OUT.${peer}`)}});return registry;}
function validMessage(message:unknown):message is SoulMeshMessage{try{validateSoulMeshMessage(message);const value=message as SoulMeshMessage;return value.target===NUCLEUS_ID&&value.source!==NUCLEUS_ID&&value.kind==='request'&&typeof value.capability==='string'&&Math.abs(Date.now()-value.timestamp)<=MAX_CLOCK_SKEW_MS;}catch{return false;}}
export async function GET(){return NextResponse.json({ok:true,nucleus:NUCLEUS_ID,protocol:'soul-mesh/1',peers:[...PEERS],capabilities:getN06Capabilities(),agents:createN06Agents().describe(),channels:{in:PEERS.map(p=>`N06.IN.${p}`),out:PEERS.map(p=>`N06.OUT.${p}`)}});}
export async function POST(request:Request){const raw=await request.text();if(new TextEncoder().encode(raw).byteLength>MAX_PAYLOAD_BYTES)return NextResponse.json({error:'SOUL_MESH_PAYLOAD_TOO_LARGE'},{status:413});let message:unknown;try{message=JSON.parse(raw);}catch{return NextResponse.json({error:'INVALID_SOUL_MESH_JSON'},{status:400});}if(!validMessage(message))return NextResponse.json({error:'INVALID_SOUL_MESH_MESSAGE'},{status:400});if(!authorized(request,message))return NextResponse.json({error:'Unauthorized'},{status:401});if(!rateAllowed(message.source))return result(message,'error',{code:'RATE_LIMITED',retryAfterMs:RATE_WINDOW_MS},429);if(!acceptOnce(message.id))return result(message,'error',{code:'REPLAY_DETECTED'},409);try{return result(message,'response',await createN06Agents().execute(message));}catch(error){const detail=error instanceof Error?error.message:String(error);const code=detail.startsWith('N06_CAPABILITY_DENIED')?'CAPABILITY_DENIED':detail.startsWith('CAPABILITY_HANDLER_NOT_REGISTERED')?'CAPABILITY_NOT_IMPLEMENTED':detail.startsWith('UNKNOWN_TOOL')?'UNKNOWN_TOOL':detail==='N06_TOOL_CONTEXT_REQUIRED'?'CAPABILITY_CONTEXT_REQUIRED':'CAPABILITY_EXECUTION_ERROR';const status=code==='CAPABILITY_NOT_IMPLEMENTED'?501:code==='CAPABILITY_DENIED'?403:500;return result(message,'error',{code,message:detail},status);}}
