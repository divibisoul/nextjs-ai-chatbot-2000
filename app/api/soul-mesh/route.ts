import { NextResponse } from 'next/server';
import type { SoulMeshMessage } from '@/lib/soul-mesh/SoulMeshProtocol';
import { executeN06Capability } from '@/lib/soul-mesh/N06CapabilityDispatcher';
const NUCLEUS_ID='N06' as const;
const NUCLEI=new Set(['N01','N02','N03','N04','N05','N06']);
const PEERS=['N01','N02','N03','N04','N05'] as const;
function authorized(request:Request){const token=process.env.SOUL_MESH_TOKEN;return !token||request.headers.get('authorization')===`Bearer ${token}`;}
function result(message:SoulMeshMessage,kind:'response'|'error',payload:unknown,status=200){return NextResponse.json({protocol:'soul-mesh/1',id:crypto.randomUUID(),correlationId:message.correlationId,source:NUCLEUS_ID,target:message.source,kind,capability:message.capability,payload,timestamp:Date.now()} satisfies SoulMeshMessage,{status});}
export async function POST(request:Request){
 if(!authorized(request))return NextResponse.json({error:'Unauthorized'},{status:401});
 const message=(await request.json().catch(()=>null)) as SoulMeshMessage|null;
 if(!message||message.protocol!=='soul-mesh/1'||!message.id||!message.correlationId||!NUCLEI.has(message.source)||message.target!==NUCLEUS_ID||message.source===NUCLEUS_ID||!message.capability)return NextResponse.json({error:'INVALID_SOUL_MESH_MESSAGE'},{status:400});
 if(message.kind!=='request')return NextResponse.json({accepted:true,correlationId:message.correlationId,source:NUCLEUS_ID,target:message.source});
 if(message.capability==='mesh.ping')return result(message,'response',{ok:true});
 if(message.capability==='mesh.describe')return result(message,'response',{nucleus:NUCLEUS_ID,peers:[...PEERS],capabilities:['tool-execution','ai-pilot','artifact-processing','document-processing','context-orchestration','streaming','mesh-communication']});
 try{return result(message,'response',await executeN06Capability(message.capability,message.payload,{} as never));}
 catch(error){return result(message,'error',{code:'CAPABILITY_EXECUTION_ERROR',message:error instanceof Error?error.message:String(error)},500);}
}
