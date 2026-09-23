import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import type { SoulMeshMessage } from '@/lib/soul-mesh/SoulMeshProtocol';
import { SOUL_MESH_CONTRACT_VERSION, validateSoulMeshMessage } from '@/lib/soul-mesh/SoulMeshProtocol';
import { executeN06Capability, getN06Capabilities } from '@/lib/soul-mesh/N06CapabilityDispatcher';
import { N06AgentRegistry } from '@/lib/soul-mesh/N06AgentRegistry';
import { OCTACORE_MESH_CAPABILITY } from '@/lib/soul-mesh/SoulMeshCapabilities';
import { n06Processor } from '@/lib/soul-core/N06Processor';
import type { N06MeshExecutionContext } from '@/lib/soul-mesh/N06CapabilityDispatcher';
import { NUCLEUS_06_TOOL_IDS } from '@/lib/soul-core/Nucleus05ToolRegistry';
import { getN06StructuralPeers, probeAllN06Peers } from '@/lib/soul-mesh/N06PeerAdapter';
import { verifySoulMeshMessage } from '@/lib/soul-mesh/SoulMeshHmac';
import { createMeshToolSession, meshDataStream } from '@/lib/soul-mesh/N06MeshToolContext';
import { executeOctaCoreN06 } from '@/lib/octacore/OctaCoreN06Adapter';

const NUCLEUS_ID='N06' as const;
const PEERS=['N01','N02','N03','N04','N05','N07'] as const;
const STRUCTURAL_PEERS=['N01','N02','N03','N04','N05','N07'] as const;
const MAX_PAYLOAD_BYTES=1024*1024;
const MAX_CLOCK_SKEW_MS=30_000;
const REPLAY_WINDOW_MS=5*60_000;
const RATE_LIMIT=100;
const RATE_WINDOW_MS=60_000;
const seenRequests=new Map<string,number>();
const peerBuckets=new Map<string,number[]>();
function secret(){return process.env.SOUL_MESH_HMAC_SECRET ?? '';}
function authorized(request:Request,message:SoulMeshMessage){const configured=secret();if(!configured)return process.env.NODE_ENV !== 'production';const nonce=request.headers.get('x-soul-mesh-nonce') ?? message.meta?.nonce ?? '';const hmac=request.headers.get('x-soul-mesh-hmac') ?? '';return verifySoulMeshMessage(message,configured,nonce,hmac);}
function acceptOnce(id:string):boolean{const now=Date.now();for(const [key,t] of seenRequests)if(now-t>REPLAY_WINDOW_MS)seenRequests.delete(key);if(seenRequests.has(id))return false;seenRequests.set(id,now);return true;}
function rateAllowed(peer:string):boolean{const now=Date.now();const recent=(peerBuckets.get(peer)??[]).filter(t=>now-t<RATE_WINDOW_MS);if(recent.length>=RATE_LIMIT){peerBuckets.set(peer,recent);return false;}recent.push(now);peerBuckets.set(peer,recent);return true;}
const declaredMeshCapabilities = () => [...getN06Capabilities(), OCTACORE_MESH_CAPABILITY.id];

function result(message:SoulMeshMessage,kind:'response'|'error',payload:unknown,status=200){
  const id=crypto.randomUUID();
  const nonce=crypto.randomUUID();
  const timestamp=Date.now();
  const legacy={
    version:'1.0',
    contractVersion:SOUL_MESH_CONTRACT_VERSION,
    messageId:id,
    source:NUCLEUS_ID,
    target:message.source,
    timestamp,
    nonce,
    correlationId:message.correlationId,
    type:kind==='error'?'ERROR':'TASK_RESULT',
    payload:{capability:message.capability??'',payload},
  };
  const secret=String(process.env.SOUL_MESH_HMAC_SECRET||'').trim();
  const hmac=secret?crypto.createHmac('sha256',secret).update(JSON.stringify(legacy),'utf8').digest('hex'):'';
  const body={protocol:'soul-mesh/1',contractVersion:SOUL_MESH_CONTRACT_VERSION,id,correlationId:message.correlationId,source:NUCLEUS_ID,target:message.source,kind,capability:message.capability,payload,timestamp,transport:'HTTP',nonce,...(hmac?{hmac}:{}),meta:{runtime:'nextjs-ai-chatbot-2000',transport:'HTTP',encoding:'json',version:SOUL_MESH_CONTRACT_VERSION,nonce,traceId:message.correlationId}};
  return NextResponse.json(body satisfies SoulMeshMessage,{status});
}
function createN06Agents(context?:N06MeshExecutionContext){const registry=new N06AgentRegistry();const executable=n06Processor.executableCapabilities();registry.register({id:'N06-cognitive-agent',name:'N06 Cognitive Agent',capabilities:executable,execute:m=>{if(!m.capability)throw new Error('N06_AGENT_CAPABILITY_REQUIRED');return executeN06Capability(m.capability,m.payload,context)}});registry.register({id:'N06-tool-agent',name:'N06 Tool Agent',capabilities:NUCLEUS_06_TOOL_IDS.map(id=>`tool:${id}`),execute:m=>{if(!m.capability)throw new Error('N06_AGENT_CAPABILITY_REQUIRED');return executeN06Capability(m.capability,m.payload,context)}});registry.register({id:'N06-mesh-agent',name:'N06 Mesh Agent',capabilities:['mesh.ping','mesh.describe','mesh.discovery'],execute:async m=>m.capability==='mesh.ping'?{ok:true,nucleus:NUCLEUS_ID,processedAt:Date.now()}:m.capability==='mesh.discovery'?{nucleus:NUCLEUS_ID,peers:await probeAllN06Peers(),structuralPeers:getN06StructuralPeers()}:{nucleus:NUCLEUS_ID,peers:[...PEERS],structuralPeers:[...STRUCTURAL_PEERS],declaredCapabilities:declaredMeshCapabilities(),executableCapabilities:executable,agents:registry.describe(),inChannels:PEERS.map(peer=>`N06.IN.${peer}`),outChannels:PEERS.map(peer=>`N06.OUT.${peer}`)}});return registry;}
function validMessage(message:unknown):message is SoulMeshMessage{try{validateSoulMeshMessage(message);const value=message as SoulMeshMessage;return value.target===NUCLEUS_ID&&value.source!==NUCLEUS_ID&&value.kind==='request'&&typeof value.capability==='string'&&Math.abs(Date.now()-value.timestamp)<=MAX_CLOCK_SKEW_MS;}catch{return false;}}
export async function GET(){return NextResponse.json({ok:true,nucleus:NUCLEUS_ID,protocol:'soul-mesh/1',contractVersion:SOUL_MESH_CONTRACT_VERSION,peers:[...PEERS],structuralPeers:[...STRUCTURAL_PEERS],capabilities:[...getN06Capabilities(),'octacore.execute'],executableCapabilities:[...n06Processor.executableCapabilities(),'octacore.execute'],agents:createN06Agents().describe(),channels:{in:PEERS.map(p=>`N06.IN.${p}`),out:PEERS.map(p=>`N06.OUT.${p}`)}});}
export async function POST(request:Request){
  const raw=await request.text();
  if(new TextEncoder().encode(raw).byteLength>MAX_PAYLOAD_BYTES)return NextResponse.json({error:'SOUL_MESH_PAYLOAD_TOO_LARGE'},{status:413});
  let message:unknown;
  try{message=JSON.parse(raw);}catch{return NextResponse.json({error:'INVALID_SOUL_MESH_JSON'},{status:400});}
  if(!validMessage(message))return NextResponse.json({error:'INVALID_SOUL_MESH_MESSAGE'},{status:400});
  if(!authorized(request,message))return NextResponse.json({error:'Unauthorized'},{status:401});
  if(!rateAllowed(message.source))return result(message,'error',{code:'RATE_LIMITED',retryAfterMs:RATE_WINDOW_MS},429);
  if(!acceptOnce(message.id))return result(message,'error',{code:'REPLAY_DETECTED'},409);
  try{
    const session=await auth();
    const userId=typeof session?.user?.id==='string'?session.user.id.trim():'';
    if(!userId)return result(message,'error',{code:'MESH_USER_ID_REQUIRED'},401);
    const context:N06MeshExecutionContext={
      session:createMeshToolSession({userId,source:message.source,correlationId:message.correlationId}),
      dataStream:meshDataStream,
      metadata:{mesh:true,source:message.source,correlationId:message.correlationId},
    };
    if(message.capability==='octacore.execute'){
      const value=message.payload&&typeof message.payload==='object'&&!Array.isArray(message.payload)
        ? message.payload as Record<string,unknown>
        : null;
      if(!value)return result(message,'error',{code:'OCTACORE_N06_PAYLOAD_MUST_BE_OBJECT'},400);
      return result(
        message,
        'response',
        await executeOctaCoreN06({
          capability:typeof value.capability==='string'?value.capability:'',
          payload:value.payload,
          job_id:typeof value.job_id==='string'?value.job_id:undefined,
          correlation_id:message.correlationId,
        },context),
      );
    }
    return result(message,'response',await createN06Agents(context).execute(message));
  }catch(error){
    const detail=error instanceof Error?error.message:String(error);
    const code=detail.startsWith('N06_CAPABILITY_DENIED')?'CAPABILITY_DENIED'
      :detail.startsWith('CAPABILITY_HANDLER_NOT_REGISTERED')?'CAPABILITY_NOT_IMPLEMENTED'
      :detail.startsWith('UNKNOWN_TOOL')?'UNKNOWN_TOOL'
      :detail==='N06_TOOL_CONTEXT_REQUIRED'?'CAPABILITY_CONTEXT_REQUIRED'
      :detail==='N06_MESH_USER_ID_REQUIRED'?'MESH_USER_ID_REQUIRED'
      :'CAPABILITY_EXECUTION_ERROR';
    const status=code==='CAPABILITY_NOT_IMPLEMENTED'?501
      :code==='CAPABILITY_DENIED'?403
      :code==='CAPABILITY_CONTEXT_REQUIRED'||code==='MESH_USER_ID_REQUIRED'?401
      :500;
    return result(message,'error',{code,message:detail},status);
  }
}
