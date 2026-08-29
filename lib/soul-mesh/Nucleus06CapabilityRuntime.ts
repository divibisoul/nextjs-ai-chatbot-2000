import { n06Processor } from '@/lib/soul-core/N06Processor';

export type Nucleus06Handler = (input: unknown, context?: Record<string, unknown>) => Promise<unknown>;

/** Canonical N06 capability runtime. Mesh dispatch and local execution share the N06 processor boundary. */
export class Nucleus06CapabilityRuntime {
  private readonly handlers = new Map<string, Nucleus06Handler>();

  register(capability: string, handler: Nucleus06Handler) {
    if (!capability.trim()) throw new Error('CAPABILITY_ID_REQUIRED');
    if (this.handlers.has(capability)) throw new Error(`CAPABILITY_HANDLER_ALREADY_REGISTERED: ${capability}`);
    this.handlers.set(capability, handler);
    return this;
  }

  has(capability: string) {
    return n06Processor.executableCapabilities().includes(capability as never);
  }

  declared() {
    return [...n06Processor.capabilities];
  }

  executable() {
    return n06Processor.executableCapabilities();
  }

  async execute(capability: string, input: unknown, context?: Record<string, unknown>) {
    if (!this.declared().includes(capability as never)) {
      const error = new Error(`CAPABILITY_NOT_DECLARED: ${capability}`);
      (error as Error & { code?: string }).code = 'CAPABILITY_NOT_DECLARED';
      throw error;
    }
    const handler = this.handlers.get(capability);
    if (handler) return handler(input, context);
    return n06Processor.execute({ capability: capability as never, input }, context);
  }
}

export const nucleus06CapabilityRuntime = new Nucleus06CapabilityRuntime();
