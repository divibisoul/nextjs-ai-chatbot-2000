import { n06CapabilityEngine } from '@/lib/soul-core/N06CapabilityEngine';

export type Nucleus06Handler = (input: unknown, context?: Record<string, unknown>) => Promise<unknown>;

/** @deprecated Compatibility facade. N06CapabilityEngine is the single execution authority. */
export class Nucleus06CapabilityRuntime {
  register(capability: string, handler: Nucleus06Handler) {
    n06CapabilityEngine.registerHandler(capability as never, handler as never);
    return this;
  }

  has(capability: string) {
    return n06CapabilityEngine.supports(capability);
  }

  declared() {
    return [...n06CapabilityEngine.capabilities];
  }

  executable() {
    return n06CapabilityEngine.executableCapabilities();
  }

  async execute(capability: string, input: unknown, context?: Record<string, unknown>) {
    if (!this.declared().includes(capability as never)) {
      const error = new Error(`CAPABILITY_NOT_DECLARED: ${capability}`);
      (error as Error & { code?: string }).code = 'CAPABILITY_NOT_DECLARED';
      throw error;
    }
    return n06CapabilityEngine.execute(capability, input, context);
  }
}

/** @deprecated Prefer n06CapabilityEngine directly. */
export const nucleus06CapabilityRuntime = new Nucleus06CapabilityRuntime();
