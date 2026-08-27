import { nucleus05Processor } from '@/lib/soul-core/Nucleus05Processor';

export type Nucleus06Handler = (input: unknown, context?: Record<string, unknown>) => Promise<unknown>;

/** Canonical N06 capability runtime. Reuses the existing processor and tool registry; no duplicate AI runtime. */
export class Nucleus06CapabilityRuntime {
  private readonly handlers = new Map<string, Nucleus06Handler>();

  register(capability: string, handler: Nucleus06Handler) {
    if (!capability.trim()) throw new Error('CAPABILITY_ID_REQUIRED');
    if (this.handlers.has(capability)) throw new Error(`CAPABILITY_HANDLER_ALREADY_REGISTERED: ${capability}`);
    this.handlers.set(capability, handler);
    return this;
  }

  has(capability: string) {
    return capability === 'ai-pilot' ? Boolean(nucleus05Processor.getPilot()) : this.handlers.has(capability);
  }

  declared() {
    return [...nucleus05Processor.capabilities];
  }

  executable() {
    return this.declared().filter(capability => this.has(capability));
  }

  async execute(capability: string, input: unknown, context?: Record<string, unknown>) {
    if (!this.declared().includes(capability)) {
      const error = new Error(`CAPABILITY_NOT_DECLARED: ${capability}`);
      (error as Error & { code?: string }).code = 'CAPABILITY_NOT_DECLARED';
      throw error;
    }
    if (capability === 'ai-pilot') {
      return nucleus05Processor.execute({ capability: 'ai-pilot', input }, context);
    }
    const handler = this.handlers.get(capability);
    if (!handler) {
      const error = new Error(`CAPABILITY_HANDLER_NOT_REGISTERED: ${capability}`);
      (error as Error & { code?: string }).code = 'CAPABILITY_HANDLER_NOT_REGISTERED';
      throw error;
    }
    return handler(input, context);
  }
}

export const nucleus06CapabilityRuntime = new Nucleus06CapabilityRuntime();
