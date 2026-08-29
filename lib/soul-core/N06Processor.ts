import { NUCLEUS_06_CAPABILITIES, type Nucleus06Capability } from './Nucleus06Capabilities';

export interface N06Context { session?: unknown; dataStream?: unknown; metadata?: Record<string, unknown>; }
export type N06Handler = (input: unknown, context?: N06Context) => Promise<unknown>;
export interface N06Request { capability: Nucleus06Capability; input: unknown; requestId?: string; }
export interface N06Pilot { id: string; execute(input: unknown, context?: N06Context): Promise<unknown>; }

export class N06Processor {
  readonly id = 'nucleus-06' as const;
  readonly capabilities = NUCLEUS_06_CAPABILITIES;
  private readonly handlers = new Map<Nucleus06Capability, N06Handler>();
  private pilot?: N06Pilot;
  registerHandler(capability: Nucleus06Capability, handler: N06Handler) { this.handlers.set(capability, handler); return this; }
  registerPilot(pilot: N06Pilot) { this.pilot = pilot; return this; }
  getPilot() { return this.pilot; }
  listHandlers() { return [...this.handlers.keys()]; }
  executableCapabilities() { return [...this.capabilities].filter((c) => c === 'support.ai-pilot' ? Boolean(this.pilot) : this.handlers.has(c)); }
  supports(capability: string): capability is Nucleus06Capability { return (this.capabilities as readonly string[]).includes(capability); }
  async execute(request: N06Request, context?: N06Context) {
    if (!this.supports(request.capability)) throw new Error(`Unsupported Nucleus 06 capability: ${request.capability}`);
    if (request.capability === 'support.ai-pilot') {
      if (!this.pilot) throw new Error('No AI pilot is connected to Nucleus 06');
      return this.pilot.execute(request.input, context);
    }
    const handler = this.handlers.get(request.capability);
    if (!handler) throw new Error(`Capability is registered but has no runtime handler: ${request.capability}`);
    return handler(request.input, context);
  }
}

export const n06Processor = new N06Processor();
