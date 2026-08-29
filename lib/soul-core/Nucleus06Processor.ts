import {
  NUCLEUS_06_CAPABILITIES,
  type Nucleus06Capability,
} from './Nucleus06Capabilities';

export interface Nucleus06Context {
  session?: unknown;
  dataStream?: unknown;
  metadata?: Record<string, unknown>;
}

export interface Nucleus06Request {
  capability: Nucleus06Capability;
  input: unknown;
  requestId?: string;
}

export interface Nucleus06Pilot {
  id: string;
  execute(input: unknown, context?: Nucleus06Context): Promise<unknown>;
}

export type Nucleus06Handler = (
  input: unknown,
  context?: Nucleus06Context,
) => Promise<unknown>;

/** Canonical N06 cognitive runtime. Provider-specific AI remains an adapter; Soul owns orchestration. */
export class Nucleus06Processor {
  readonly id = 'nucleus-06' as const;
  readonly capabilities = NUCLEUS_06_CAPABILITIES;
  private readonly handlers = new Map<Nucleus06Capability, Nucleus06Handler>();
  private pilot?: Nucleus06Pilot;

  registerHandler(capability: Nucleus06Capability, handler: Nucleus06Handler) {
    this.handlers.set(capability, handler);
    return this;
  }

  registerPilot(pilot: Nucleus06Pilot) {
    this.pilot = pilot;
    return this;
  }

  getPilot() {
    return this.pilot;
  }

  listHandlers() {
    return [...this.handlers.keys()];
  }

  executableCapabilities(): Nucleus06Capability[] {
    return [...this.capabilities].filter((capability) =>
      capability === 'support.ai-pilot'
        ? Boolean(this.pilot)
        : this.handlers.has(capability),
    );
  }

  supports(capability: string): capability is Nucleus06Capability {
    return (this.capabilities as readonly string[]).includes(capability);
  }

  async execute(request: Nucleus06Request, context?: Nucleus06Context) {
    if (!this.supports(request.capability)) {
      throw new Error(`Unsupported Nucleus 06 capability: ${request.capability}`);
    }

    if (request.capability === 'support.ai-pilot') {
      if (!this.pilot) {
        throw new Error('No AI pilot is connected to Nucleus 06');
      }
      return this.pilot.execute(request.input, context);
    }

    const handler = this.handlers.get(request.capability);
    if (!handler) {
      throw new Error(
        `Capability is registered but has no runtime handler: ${request.capability}`,
      );
    }

    return handler(request.input, context);
  }
}

export const nucleus06Processor = new Nucleus06Processor();
