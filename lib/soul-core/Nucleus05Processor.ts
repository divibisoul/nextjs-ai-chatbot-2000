import { NUCLEUS_05_CAPABILITIES, type Nucleus05Capability } from './Nucleus05Capabilities';

export interface Nucleus05Context { session?: unknown; dataStream?: unknown; metadata?: Record<string, unknown>; }
export interface Nucleus05Request { capability: Nucleus05Capability; input: unknown; requestId?: string; }
export interface Nucleus05Pilot { id: string; execute(input: unknown, context?: Nucleus05Context): Promise<unknown>; }
export type Nucleus05Handler = (input: unknown, context?: Nucleus05Context) => Promise<unknown>;

/** N06 runtime boundary. Provider-specific AI remains an adapter; Soul owns orchestration. */
export class Nucleus05Processor {
  readonly id = 'nucleus-05' as const;
  readonly capabilities = NUCLEUS_05_CAPABILITIES;
  private readonly handlers = new Map<Nucleus05Capability, Nucleus05Handler>();
  private pilot?: Nucleus05Pilot;

  registerHandler(capability: Nucleus05Capability, handler: Nucleus05Handler) { this.handlers.set(capability, handler); return this; }
  registerPilot(pilot: Nucleus05Pilot) { this.pilot = pilot; return this; }
  getPilot() { return this.pilot; }
  listHandlers() { return [...this.handlers.keys()]; }
  executableCapabilities() { return this.capabilities.filter(capability => capability === 'ai-pilot' ? Boolean(this.pilot) : this.handlers.has(capability)); }
  supports(capability: string): capability is Nucleus05Capability { return this.capabilities.includes(capability as Nucleus05Capability); }

  async execute(request: Nucleus05Request, context?: Nucleus05Context) {
    if (!this.supports(request.capability)) throw new Error(`Unsupported Nucleus 05 capability: ${request.capability}`);
    if (request.capability === 'ai-pilot') {
      if (!this.pilot) throw new Error('No AI pilot is connected to Nucleus 05');
      return this.pilot.execute(request.input, context);
    }
    const handler = this.handlers.get(request.capability);
    if (!handler) throw new Error(`Capability is registered but has no runtime handler: ${request.capability}`);
    return handler(request.input, context);
  }
}

export const nucleus05Processor = new Nucleus05Processor();
