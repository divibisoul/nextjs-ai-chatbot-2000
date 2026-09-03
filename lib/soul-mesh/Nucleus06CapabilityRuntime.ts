import { n06Processor } from '@/lib/soul-core/N06Processor';

export type Nucleus06Handler = (input: unknown, context?: Record<string, unknown>) => Promise<unknown>;

/**
 * Canonical N06 execution facade.
 *
 * Lei Zero invariant: this module MUST NOT own a second handler registry.
 * N06Processor is the only runtime authority for capability registration and execution.
 * This facade exists only to preserve the historical import surface while delegating
 * every operation to the canonical processor.
 */
export class Nucleus06CapabilityRuntime {
  register(capability: string, handler: Nucleus06Handler) {
    if (!capability.trim()) throw new Error('CAPABILITY_ID_REQUIRED');
    n06Processor.registerHandler(capability as never, handler as never);
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
    return n06Processor.execute({ capability: capability as never, input }, context);
  }
}

/** Compatibility facade only; the processor remains the sole execution authority. */
export const nucleus06CapabilityRuntime = new Nucleus06CapabilityRuntime();
