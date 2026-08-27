import { executeN06Capability, getN06Capabilities } from './N06CapabilityDispatcher';

export const NUCLEUS_ID = 'N06' as const;
export const SOUL_MESH_PROTOCOL = 'soul-mesh/1' as const;
export type SoulMeshMessage={protocol:typeof SOUL_MESH_PROTOCOL;id:string;correlationId:string;source:'N01'|'N02'|'N03'|'N04'|'N05'|'N06';target:'N01'|'N02'|'N03'|'N04'|'N05'|'N06';kind:'request'|'response'|'event'|'error'|'ack';capability?:string;payload:unknown;timestamp:number;transport?:string};
const nuclei=new Set(['N01','N02','N03','N04','N05','N06']);
export function validateMeshMessage(m:SoulMeshMessage){if(m.protocol!==SOUL_MESH_PROTOCOL)throw new Error('UNSUPPORTED_MESH_PROTOCOL');if(!m.id||!m.correlationId)throw new Error('MISSING_MESSAGE_ID');if(!nuclei.has(m.source)||!nuclei.has(m.target)||m.source===m.target)throw new Error('INVALID_NUCLEUS_ROUTE');if(!m.capability&&m.kind!=='event'&&m.kind!=='ack')throw new Error('MISSING_CAPABILITY');if(!Number.isFinite(m.timestamp))throw new Error('INVALID_TIMESTAMP');return true}

export function getN06MeshCapabilities(){return getN06Capabilities()}

export async function handleMeshMessage(message:SoulMeshMessage,handlers:Record<string,(payload:unknown)=>Promise<unknown>|unknown>={}){validateMeshMessage(message);if(message.target!==NUCLEUS_ID)throw new Error('WRONG_TARGET');if(message.kind==='ack'||message.kind!=='request')return message;const capability=message.capability!;const externalHandler=handlers[capability];try{const result=externalHandler?await externalHandler(message.payload):await executeN06Capability(capability,message.payload);return{...message,kind:'response' as const,payload:result}}catch(error){return{...message,kind:'error' as const,payload:{code:'CAPABILITY_EXECUTION_ERROR',capability,detail:error instanceof Error?error.message:'Unknown error'}}}}
