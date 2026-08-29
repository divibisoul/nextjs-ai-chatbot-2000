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

/**
 * N06 runtime boundary. The provider-specific AI remains an adapter;
 * Soul owns orchestration and inter-core interoperability.
 */
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

  executableCapabilities() {
    return this.capabilities.filter((capability) =>
      capability === 'ai-pilot' || capability === 'support.ai-pilot'
        ? Boolean(this.pilot)
        : this.handlers.has(capability),
    );
  }

  supports(capability: string): capability is Nucleus06Capability {
    return (this.capabilities as readonly string[]).includes(capability);
  }

  async execute(
    request: Nucleus06Request,
    context?: Nucleus06Context,
  ): Promise<unknown> {
    if (!this.supports(request.capability)) {
      throw new Error(`Unsupported Nucleus 06 capability: ${request.capability}`);
    }

    const canonicalAlias: Partial<Record<Nucleus06Capability, Nucleus06Capability>> = {
      'support.context': 'context-orchestration',
      'support.artifacts': 'artifact-processing',
      'support.documents': 'document-processing',
      'support.tool-execution': 'tool-execution',
      'support.streaming': 'streaming',
      'support.mesh': 'mesh-communication',
      'support.ai-pilot': 'ai-pilot',
    };
    const resolved = canonicalAlias[request.capability] ?? request.capability;

    if (resolved === 'ai-pilot') {
      if (!this.pilot) {
        throw new Error('No AI pilot is connected to Nucleus 06');
      }
      return this.pilot.execute(request.input, context);
    }

    const handler = this.handlers.get(resolved);
    if (!handler) {
      throw new Error(
        `Capability is registered but has no runtime handler: ${resolved}`,
      );
    }
    return handler(request.input, context);
  }
}

export const nucleus06Processor = new Nucleus06Processor();

/** Backward-compatible aliases for existing Nucleus05 imports. */
export type Nucleus05Context = Nucleus06Context;
export type Nucleus05Capability = Nucleus06Capability;
export type Nucleus05Request = Nucleus06Request;
export type Nucleus05Pilot = Nucleus06Pilot;
export type Nucleus05Handler = Nucleus06Handler;
export const Nucleus05Processor = Nucleus06Processor;
export const nucleus05Processor = nucleus06Processor;
