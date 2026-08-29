import { NUCLEUS_05_CAPABILITIES, type Nucleus05Capability } from './Nucleus05Capabilities';

export interface Nucleus06Context { session?: unknown; dataStream?: unknown; metadata?: Record<string, unknown>; }
export interface Nucleus06Request { capability: Nucleus05Capability; input: unknown; requestId?: string; }
export interface Nucleus06Pilot { id: string; execute(input: unknown, context?: Nucleus06Context): Promise<unknown>; }
export type Nucleus06Handler = (input: unknown, context?: Nucleus06Context) => Promise<unknown>;

/** N06 runtime boundary. Provider-specific AI remains an adapter; Soul owns orchestration. */
export class Nucleus06Processor {
  readonly id = 'nucleus-06' as const;
  readonly capabilities = NUCLEUS_05_CAPABILITIES;
  private readonly handlers = new Map<Nucleus05Capability, Nucleus06Handler>();
  private pilot?: Nucleus06Pilot;

  registerHandler(capability: Nucleus05Capability, handler: Nucleus06Handler) { this.handlers.set(capability, handler); return this; }
  registerPilot(pilot: Nucleus06Pilot) { this.pilot = pilot; return this; }
  getPilot() { return this.pilot; }
  listHandlers() { return [...this.handlers.keys()]; }
  executableCapabilities() { return this.capabilities.filter(capability => capability === 'ai-pilot' ? Boolean(this.pilot) : this.handlers.has(capability)); }
  supports(capability: string): capability is Nucleus05Capability { return this.capabilities.includes(capability as Nucleus05Capability); }

  async execute(request: Nucleus06Request, context?: Nucleus06Context) {
    if (!this.supports(request.capability)) throw new Error(`Unsupported Nucleus 06 capability: ${request.capability}`);
    if (request.capability === 'ai-pilot') {
      if (!this.pilot) throw new Error('No AI pilot is connected to Nucleus 06');
      return this.pilot.execute(request.input, context);
    }
    const handler = this.handlers.get(request.capability);
    if (!handler) throw new Error(`Capability is registered but has no runtime handler: ${request.capability}`);
    return handler(request.input, context);
  }
}

export const nucleus06Processor = new Nucleus06Processor();

/** Backward-compatible aliases for existing Nucleus05 imports. */
export type Nucleus05Context = Nucleus06Context;
export type Nucleus05Request = Nucleus06Request;
export type Nucleus05Pilot = Nucleus06Pilot;
export type Nucleus05Handler = Nucleus06Handler;
export const Nucleus05Processor = Nucleus06Processor;
export const nucleus05Processor = nucleus06Processor;
