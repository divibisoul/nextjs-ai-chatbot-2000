import type { Nucleus06Capability } from './Nucleus06Capabilities';
import type { Nucleus05Capability } from './Nucleus05Capabilities';
import { n06CapabilityEngine, type N06EngineContext, type N06EngineHandler, type N06EnginePilot } from './N06CapabilityEngine';

export type N06Context = N06EngineContext;
export type N06Handler = N06EngineHandler;
export interface N06Request { capability: Nucleus06Capability | Nucleus05Capability; input: unknown; requestId?: string; }
export type N06Pilot = N06EnginePilot;

/** @deprecated Compatibility facade. N06CapabilityEngine is the single execution authority. */
export class N06Processor {
  readonly id = 'nucleus-06' as const;
  readonly capabilities = n06CapabilityEngine.capabilities;

  registerHandler(capability: Nucleus06Capability, handler: N06Handler): this {
    n06CapabilityEngine.registerHandler(capability, handler);
    return this;
  }

  registerPilot(pilot: N06Pilot): this {
    n06CapabilityEngine.registerPilot(pilot);
    return this;
  }

  getPilot(): N06Pilot | undefined { return n06CapabilityEngine.getPilot(); }
  listHandlers(): Nucleus06Capability[] { return n06CapabilityEngine.listHandlers(); }
  executableCapabilities(): Nucleus06Capability[] { return n06CapabilityEngine.executableCapabilities(); }
  supports(capability: string): boolean { return n06CapabilityEngine.supports(capability); }
  async execute(request: N06Request, context?: N06Context): Promise<unknown> { return n06CapabilityEngine.execute(request.capability, request.input, context); }
}

/** @deprecated Prefer the canonical n06CapabilityEngine singleton. */
export const n06Processor = new N06Processor();
