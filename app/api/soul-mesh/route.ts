import { NextResponse } from 'next/server';
import type { SoulMeshMessage } from '@/lib/soul-mesh/SoulMeshProtocol';
import { executeN06Capability } from '@/lib/soul-mesh/N06CapabilityDispatcher';
import { nucleus05Processor } from '@/lib/soul-core/Nucleus05Processor';

const NUCLEUS_ID='N06' as const;
const NUCLEI=new Set(['N01','N02','N03','N04','N05','N06']);
const PEERS=['N01','N02','N03','N04','N05'] as const;
const MAX_PAYLOAD_BYTES=1024*1024;
function authorized(request:Request){const token=process.env.SOUL_MESH_TOKEN;return !token||request.headers.get('authorization')===`Bearer ${token}`;}
function result(message:SoulMeshMessage,kind:'response'|'error',payload:unknown,status=200){return NextResponse.json({protocol:'soul-mesh/1',id:crypto.randomUUID(),correlationId:message.correlationId,source:NUCLEUS_ID,target:message.source,kind,capability:message.capability,payload,timestamp:Date.now()} satisfies SoulMeshMessage,{status});}
export async function POST(request:Request){
 if(!authorized(request))return NextResponse.json({error:'Unauthorized'},{status:401});
 const raw=await request.text();
 if(new TextEncoder().encode(raw).byteLength>MAX_PAYLOAD_BYTES)return NextResponse.json({error:'SOUL_MESH_PAYLOAD_TOO_LARGE'},{status:413});
 const message=JSON.parse(raw) as SoulMeshMessage|null;
 if(!message||message.protocol!=='soul-mesh/1'||!message.id||!message.correlationId||!NUCLEI.has(message.source)||message.target!==NUCLEUS_ID||message.source===NUCLEUS_ID||!message.capability)return NextResponse.json({error:'INVALID_SOUL_MESH_MESSAGE'},{status:400});
 if(message.kind!=='request')return NextResponse.json({accepted:true,correlationId:message.correlationId,source:NUCLEUS_ID,target:message.source});
 if(message.capability==='mesh.ping')return result(message,'response',{ok:true,nucleus:NUCLEUS_ID,processedAt:Date.now()});
 if(message.capability==='mesh.describe')return result(message,'response',{nucleus:NUCLEUS_ID,peers:[...PEERS],inChannels:PEERS.map(p=>`N06.IN.${p}`),outChannels:PEERS.map(p=>`N06.OUT.${p}`),declaredCapabilities:[...nucleus05Processor.capabilities],executableCapabilities:nucleus05Processor.executableCapabilities()});
 try{return result(message,'response',await executeN06Capability(message.capability,message.payload,{} as never));}
 catch(error){const code=(error as {code?:string}).code??(String(error).startsWith('CAPABILITY_HANDLER_NOT_REGISTERED')?'CAPABILITY_HANDLER_NOT_REGISTERED':'CAPABILITY_EXECUTION_ERROR');return result(message,'error',{code,message:error instanceof Error?error.message:String(error)},code==='CAPABILITY_HANDLER_NOT_REGISTERED'?501:500);}
}
