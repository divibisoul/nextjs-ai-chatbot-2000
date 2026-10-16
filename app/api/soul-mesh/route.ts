import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import type { SoulMeshMessage } from '@/lib/soul-mesh/SoulMeshProtocol';
import { SOUL_MESH_CONTRACT_VERSION, validateSoulMeshMessage } from '@/lib/soul-mesh/SoulMeshProtocol';
import { executeN06Capability, getN06Capabilities, requiresN06MeshUserContext } from '@/lib/soul-mesh/N06CapabilityDispatcher';
import { N06AgentRegistry } from '@/lib/soul-mesh/N06AgentRegistry';
import { n06Processor } from '@/lib/soul-core/N06Processor';
import type { N06MeshExecutionContext } from '@/lib/soul-mesh/N06CapabilityDispatcher';
import { NUCLEUS_06_TOOL_IDS } from '@/lib/soul-core/Nucleus05ToolRegistry';
import { describeN06StructuralPeers, getN06StructuralPeers, N06_ACTIVE_PEERS, N06_STRUCTURAL_PEERS, probeAllN06Peers } from '@/lib/soul-mesh/N06PeerAdapter';
import { signSoulMeshResponse, verifySoulMeshMessage } from '@/lib/soul-mesh/SoulMeshHmac';
import { createMeshToolSession, meshDataStream } from '@/lib/soul-mesh/N06MeshToolContext';
import { N06_RESIDENT_AGENT } from '@/lib/soul-mesh/N06ResidentAgent';
import { executeMetaGPTProject, metaGPTStatus } from '@/lib/soul-core/N06MetaGPTBridge';
import { executeLettaMessage, executeLettaHistory, executeLettaAgentStatus, lettaStatus } from '@/lib/soul-core/N06LettaBridge';
import { requestN07CooperationHandshake, requestN07CooperationExchange } from '@/lib/soul-mesh/N06CooperationBridge';
import { describeOpenHandsAdapter, runOpenHands, OPENHANDS_CAPABILITY } from '@/lib/soul-mesh/OpenHandsAdapter';
import { describeSmolAgentsAdapter, runSmolAgents, SMOLAGENTS_CAPABILITY, type SmolAgentsRequest } from '@/lib/soul-mesh/SmolAgentsAdapter';
import { describeDSPyAdapter, runDSPy, DSPY_CAPABILITY, type DSPyRequest } from '@/lib/soul-mesh/DSPyAdapter';

const NUCLEUS_ID='N06' as const;
const PEERS=[...N06_ACTIVE_PEERS] as const;
const STRUCTURAL_PEERS=[...N06_STRUCTURAL_PEERS] as const;
const ALL_PEERS=[...N06_ACTIVE_PEERS,...N06_STRUCTURAL_PEERS] as const;
const MAX_PAYLOAD_BYTES=1024*1024;
const MAX_CLOCK_SKEW_MS=30_000;
const REPLAY_WINDOW_MS=5*60_000;
const RATE_LIMIT=100;
const RATE_WINDOW_MS=60_000;
const seenRequests=new Map<string,number>();
const peerBuckets=new Map<string,number[]>();
const EXTERNAL_PROVIDER_CAPABILITIES=[OPENHANDS_CAPABILITY,SMOLAGENTS_CAPABILITY,DSPY_CAPABILITY,'metagpt.project.execute@1.0.0','letta.message.execute@1.0.0','letta.history.read@1.0.0','letta.agent.status@1.0.0','cooperation.handshake@1.0.0','cooperation.exchange@1.0.0'] as const;
function secret(){return process.env.SOUL_MESH_HMAC_SECRET ?? '';}
function authorized(request:Request,message:SoulMeshMessage){const configured=secret();if(!configured)return process.env.NODE_ENV !== 'production';const nonce=request.headers.get('x-soul-mesh-nonce') ?? message.meta?.nonce ?? '';const hmac=request.headers.get('x-soul-mesh-hmac') ?? '';return verifySoulMeshMessage(message,configured,nonce,hmac);}
function acceptOnce(id:string):boolean{const now=Date.now();for(const [key,t] of seenRequests)if(now-t>REPLAY_WINDOW_MS)seenRequests.delete(key);if(seenRequests.has(id))return false;seenRequests.set(id,now);return true;}
function rateAllowed(peer:string):boolean{const now=Date.now();const recent=(peerBuckets.get(peer)??[]).filter(t=>now-t<RATE_WINDOW_MS);if(recent.length>=RATE_LIMIT){peerBuckets.set(peer,recent);return false;}recent.push(now);peerBuckets.set(peer,recent);return true;}
function result(message:SoulMeshMessage,kind:'response'|'error',payload:unknown,status=200){const meshSecretValue=secret();if(meshSecretValue){const signed=signSoulMeshResponse(message,payload,kind,meshSecretValue);return NextResponse.json({...signed.message,nonce:signed.nonce,hmac:signed.hmac},{status});}return NextResponse.json({protocol:'soul-mesh/1',contractVersion:SOUL_MESH_CONTRACT_VERSION,id:crypto.randomUUID(),correlationId:message.correlationId,source:NUCLEUS_ID,target:message.source,kind,capability:message.capability,payload,timestamp:Date.now(),transport:'HTTP',meta:{runtime:'nextjs-ai-chatbot-2000',transport:'HTTP',encoding:'json',version:SOUL_MESH_CONTRACT_VERSION,traceId:message.correlationId}} satisfies SoulMeshMessage,{status});}
function createN06Agents(context?: N06MeshExecutionContext){const registry=new N06AgentRegistry();const executable=[...n06Processor.executableCapabilities(),...EXTERNAL_PROVIDER_CAPABILITIES];registry.register({id:'N06-cognitive-agent',name:'N06 Cognitive Agent',capabilities:executable,execute:m=>{if(!m.capability)throw new Error('N06_AGENT_CAPABILITY_REQUIRED');return executeN06Capability(m.capability,m.payload,context)}});registry.register({id:'N06-tool-agent',name:'N06 Tool Agent',capabilities:NUCLEUS_06_TOOL_IDS.map(id=>`tool:${id}`),execute:m=>{if(!m.capability)throw new Error('N06_AGENT_CAPABILITY_REQUIRED');return executeN06Capability(m.capability,m.payload,context)}});registry.register({id:'N06-mesh-agent',name:'N06 Mesh Agent',capabilities:['mesh.ping','mesh.describe','mesh.discovery'],execute:async m=>m.capability==='mesh.ping'?{ok:true,nucleus:NUCLEUS_ID,processedAt:Date.now()}:m.capability==='mesh.discovery'?{nucleus:NUCLEUS_ID,peers:await probeAllN06Peers(),structuralPeers:getN06StructuralPeers()}:{nucleus:NUCLEUS_ID,peers:[...PEERS],structuralPeers:[...STRUCTURAL_PEERS],declaredCapabilities:getN06Capabilities(),executableCapabilities:executable,agents:registry.describe(),inChannels:PEERS.map(peer=>`N06.IN.${peer}`),outChannels:PEERS.map(peer=>`N06.OUT.${peer}`),residentAgent:N06_RESIDENT_AGENT}});registry.register({id:'N06-SuperAGI-Agent',name:'N06 SuperAGI Agent',capabilities:['superagi.agent.create','superagi.agent.run','superagi.agent.run-status','superagi.agent.pause','superagi.agent.resume','superagi.agent.update'],execute:m=>{if(!m.capability)throw new Error('N06_AGENT_CAPABILITY_REQUIRED');return executeN06Capability(m.capability,m.payload,context)}});
registry.register({id:'N06-openhands-agent',name:'N06 OpenHands Provider Adapter',capabilities:[OPENHANDS_CAPABILITY],execute:async()=>runOpenHands()});
registry.register({id:'N06-smolagents-agent',name:'N06 smolagents Provider Agent',capabilities:[SMOLAGENTS_CAPABILITY],execute:m=>runSmolAgents((m.payload??{}) as SmolAgentsRequest)});
registry.register({id:'N06-dspy-agent',name:'N06 DSPy Reasoning Agent',capabilities:[DSPY_CAPABILITY],execute:m=>runDSPy((m.payload??{}) as DSPyRequest)});
registry.register({id:'N06-MetaGPT-Agent',name:'N06 MetaGPT Project Adapter',capabilities:['metagpt.project.execute@1.0.0'],execute:m=>executeMetaGPTProject(m.payload,m.correlationId,fetch,context as any)});
registry.register({id:'N06-Letta-Agent',name:'N06 Letta Memory Agent',capabilities:['letta.message.execute@1.0.0','letta.history.read@1.0.0','letta.agent.status@1.0.0'],execute:m=> {
 switch(m.capability){
  case 'letta.message.execute@1.0.0': return executeLettaMessage(m.payload,m.correlationId,fetch,context as any);
  case 'letta.history.read@1.0.0': return executeLettaHistory(m.payload,m.correlationId,fetch,context as any);
  case 'letta.agent.status@1.0.0': return executeLettaAgentStatus(m.payload,m.correlationId,fetch,context as any);
  default: throw new Error('N06_LETTA_CAPABILITY_UNSUPPORTED');
 }
}});
registry.register({id:'N06-Cooperation-Agent',name:'N06 N07 Cooperative Control Agent',capabilities:['cooperation.handshake@1.0.0','cooperation.exchange@1.0.0'],execute:m=>{
 const payload=(m.payload??{}) as Record<string,unknown>;
 if(m.capability==='cooperation.handshake@1.0.0') return requestN07CooperationHandshake({target:String(payload.target??'') as any,requiredCapability:String(payload.required_capability??payload.requiredCapability??''),correlationId:m.correlationId});
 return requestN07CooperationExchange({target:String(payload.target??'') as any,capability:String(payload.capability??''),payload:payload.payload,correlationId:m.correlationId});
}});
return registry;}
function validMessage(message:unknown):message is SoulMeshMessage{try{validateSoulMeshMessage(message);const value=message as SoulMeshMessage;return value.target===NUCLEUS_ID&&value.source!==NUCLEUS_ID&&value.kind==='request'&&typeof value.capability==='string'&&Math.abs(Date.now()-value.timestamp)<=MAX_CLOCK_SKEW_MS;}catch{return false;}}
export async function GET(){const providerEvidence={openhands:describeOpenHandsAdapter(),smolagents:describeSmolAgentsAdapter(),dspy:describeDSPyAdapter(),metagpt:metaGPTStatus(),letta:lettaStatus()};return NextResponse.json({ok:true,nucleus:NUCLEUS_ID,protocol:'soul-mesh/1',contractVersion:SOUL_MESH_CONTRACT_VERSION,peers:[...ALL_PEERS],activePeers:[...PEERS],structuralPeers:[...STRUCTURAL_PEERS],structuralPeerDetails:describeN06StructuralPeers(),capabilities:[...getN06Capabilities(),...EXTERNAL_PROVIDER_CAPABILITIES],executableCapabilities:n06Processor.executableCapabilities(),providerEvidence,agents:createN06Agents().describe(),channels:{in:PEERS.map(p=>`N06.IN.${p}`),out:PEERS.map(p=>`N06.OUT.${p}`)},activeChannelCount:PEERS.length*2,structuralChannelCount:STRUCTURAL_PEERS.length*2});}
export async function POST(request:Request){const raw=await request.text();if(new TextEncoder().encode(raw).byteLength>MAX_PAYLOAD_BYTES)return NextResponse.json({error:'SOUL_MESH_PAYLOAD_TOO_LARGE'},{status:413});let message:unknown;try{message=JSON.parse(raw);}catch{return NextResponse.json({error:'INVALID_SOUL_MESH_JSON'},{status:400});}if(!validMessage(message))return NextResponse.json({error:'INVALID_SOUL_MESH_MESSAGE'},{status:400});if(!authorized(request,message))return NextResponse.json({error:'Unauthorized'},{status:401});if(!rateAllowed(message.source))return result(message,'error',{code:'RATE_LIMITED',retryAfterMs:RATE_WINDOW_MS},429);if(!acceptOnce(message.id))return result(message,'error',{code:'REPLAY_DETECTED'},409);try{if(message.capability==='mesh.resident.describe@1.0.0')return result(message,'response',N06_RESIDENT_AGENT);let context:N06MeshExecutionContext|undefined;const capability=message.capability;if(capability&&requiresN06MeshUserContext(capability)){const session=await auth();const userId=typeof session?.user?.id==='string'?session.user.id.trim():'';if(!userId)return result(message,'error',{code:'MESH_USER_ID_REQUIRED'},401);context={session:createMeshToolSession({userId,source:message.source,correlationId:message.correlationId}),dataStream:meshDataStream,metadata:{mesh:true,source:message.source,correlationId:message.correlationId}};}return result(message,'response',await createN06Agents(context).execute(message));}catch(error){const detail=error instanceof Error?error.message:String(error);const code=detail.startsWith('N06_CAPABILITY_DENIED')?'CAPABILITY_DENIED':detail.startsWith('CAPABILITY_HANDLER_NOT_REGISTERED')?'CAPABILITY_NOT_IMPLEMENTED':detail.startsWith('UNKNOWN_TOOL')?'UNKNOWN_TOOL':detail==='N06_TOOL_CONTEXT_REQUIRED'?'CAPABILITY_CONTEXT_REQUIRED':detail==='N06_MESH_USER_ID_REQUIRED'?'MESH_USER_ID_REQUIRED':'CAPABILITY_EXECUTION_ERROR';const status=code==='CAPABILITY_NOT_IMPLEMENTED'?501:code==='CAPABILITY_DENIED'?403:code==='CAPABILITY_CONTEXT_REQUIRED'||code==='MESH_USER_ID_REQUIRED'?401:500;return result(message,'error',{code,message:detail},status);}}
