import { NUCLEUS_06_CAPABILITIES, type Nucleus06Capability } from './Nucleus06Capabilities';
import type { Nucleus05Capability } from './Nucleus05Capabilities';
export interface N06Context { session?: unknown; dataStream?: unknown; metadata?: Record<string, unknown>; }
export type N06Handler = (input: unknown, context?: N06Context) => Promise<unknown>;
export interface N06Request { capability: Nucleus06Capability | Nucleus05Capability; input: unknown; requestId?: string; }
export interface N06Pilot { id: string; execute(input: unknown, context?: N06Context): Promise<unknown>; }
const LEGACY_TO_CANONICAL: Record<Nucleus05Capability, Nucleus06Capability> = { 'ai-pilot':'support.ai-pilot','tool-execution':'support.tool-execution','artifact-processing':'support.artifacts','document-processing':'support.documents','context-orchestration':'support.context','streaming':'support.streaming','mesh-communication':'support.mesh' };
function normalizeCapability(capability:string):Nucleus06Capability|undefined{if((NUCLEUS_06_CAPABILITIES as readonly string[]).includes(capability))return capability as Nucleus06Capability;return LEGACY_TO_CANONICAL[capability as Nucleus05Capability];}
export class N06Processor{
 readonly id='nucleus-06' as const; readonly capabilities=NUCLEUS_06_CAPABILITIES; private readonly handlers=new Map<Nucleus06Capability,N06Handler>(); private pilot?:N06Pilot;
 registerHandler(capability:Nucleus06Capability,handler:N06Handler){this.handlers.set(capability,handler);return this;}
 registerPilot(pilot:N06Pilot){this.pilot=pilot;return this;}
 getPilot(){return this.pilot;}
 listHandlers(){return [...this.handlers.keys()];}
 executableCapabilities(){return [...this.capabilities].filter(c=>c==='support.ai-pilot'?(Boolean(this.pilot)||this.handlers.has(c)):this.handlers.has(c));}
 supports(capability:string){const canonical=normalizeCapability(capability);return canonical!==undefined&&this.executableCapabilities().includes(canonical);}
 async execute(request:N06Request,context?:N06Context){const canonical=normalizeCapability(request.capability);if(!canonical)throw new Error(`Unsupported Nucleus 06 capability: ${request.capability}`);if(canonical==='support.ai-pilot'&&this.pilot)return this.pilot.execute(request.input,context);const handler=this.handlers.get(canonical);if(!handler)throw new Error(canonical==='support.ai-pilot'?'No AI pilot is connected to Nucleus 06':`Capability is registered but has no runtime handler: ${canonical}`);return handler(request.input,context);}
}
export const n06Processor=new N06Processor();
