export const SOUL_MESH_PROTOCOL = 'soul-mesh/1' as const;
export const SOUL_NUCLEI = ['N01','N02','N03','N04','N05','N06'] as const;
export type SoulNucleus = typeof SOUL_NUCLEI[number];
export type SoulMeshKind = 'request' | 'response' | 'event' | 'error';
export type SoulMeshTransportKind = 'IN_PROCESS' | 'WEBVIEW_BRIDGE' | 'LOOPBACK_HTTP' | 'HTTP' | 'REALTIME';
export interface SoulMeshMeta { runtime?: string; transport?: string; encoding?: string; version?: string; nonce?: string; traceId?: string; }
export interface SoulMeshMessage<T=unknown>{protocol:typeof SOUL_MESH_PROTOCOL;id:string;correlationId:string;source:SoulNucleus;target:SoulNucleus;kind:SoulMeshKind;capability?:string;payload:T;timestamp:number;transport?:SoulMeshTransportKind;meta?:SoulMeshMeta;}
export interface SoulMeshTransport{send(message:SoulMeshMessage):Promise<void>;onMessage(handler:(message:SoulMeshMessage)=>void|Promise<void>):()=>void;}
export function createSoulMeshMessage<T>(input:Omit<SoulMeshMessage<T>,'protocol'|'id'|'timestamp'>):SoulMeshMessage<T>{return{protocol:SOUL_MESH_PROTOCOL,id:crypto.randomUUID(),timestamp:Date.now(),...input};}
export function validateSoulMeshMessage(value:unknown):asserts value is SoulMeshMessage{
 if(!value||typeof value!=='object')throw new Error('INVALID_MESSAGE');
 const m=value as Record<string,unknown>;
 if(m.protocol!==SOUL_MESH_PROTOCOL)throw new Error('INVALID_PROTOCOL');
 if(typeof m.id!=='string'||!m.id||m.id.length>200)throw new Error('INVALID_MESSAGE_ID');
 if(typeof m.correlationId!=='string'||!m.correlationId||m.correlationId.length>200)throw new Error('INVALID_CORRELATION');
 if(!SOUL_NUCLEI.includes(m.source as SoulNucleus)||!SOUL_NUCLEI.includes(m.target as SoulNucleus))throw new Error('INVALID_NUCLEUS');
 if(m.source===m.target)throw new Error('SELF_ROUTE_NOT_ALLOWED');
 if(!['request','response','event','error'].includes(m.kind as string))throw new Error('INVALID_KIND');
 if((m.kind==='request'||m.kind==='response'||m.kind==='error')&&(typeof m.capability!=='string'||!m.capability.trim()||m.capability.length>200))throw new Error('CAPABILITY_REQUIRED');
 if(typeof m.timestamp!=='number'||!Number.isFinite(m.timestamp))throw new Error('INVALID_TIMESTAMP');
 if(Math.abs(Date.now()-m.timestamp)>5*60*1000)throw new Error('MESSAGE_CLOCK_SKEW');
 if(m.transport!==undefined&&!['IN_PROCESS','WEBVIEW_BRIDGE','LOOPBACK_HTTP','HTTP','REALTIME'].includes(m.transport as string))throw new Error('INVALID_TRANSPORT');
 if(m.meta!==undefined&&(!m.meta||typeof m.meta!=='object'))throw new Error('INVALID_META');
}
export function isSoulMeshMessage(value:unknown):value is SoulMeshMessage{try{validateSoulMeshMessage(value);return true;}catch{return false;}}
