import { n06Processor, type N06Context } from '@/lib/soul-core/N06Processor';
import type { Nucleus06Capability } from '@/lib/soul-core/Nucleus06Capabilities';

/**
 * Compatibility facade for the canonical N06 processor.
 *
 * N06Processor is the sole execution authority. This facade deliberately
 * contains no handler registry and cannot execute a local handler itself.
 * Keeping the facade preserves existing imports while enforcing the
 * single-authority invariant required by the SOUL Law Zero.
 */
export class Nucleus06CapabilityRuntime {
  register(): never {
    throw new Error('N06_SINGLE_AUTHORITY: register handlers on n06Processor');
  }

  has(capability: string): boolean {
    return n06Processor.supports(capability);
  }

  declared(): readonly Nucleus06Capability[] {
    return n06Processor.capabilities;
  }

  executable(): readonly Nucleus06Capability[] {
    return n06Processor.executableCapabilities();
  }

  async execute(capability: string, input: unknown, context?: N06Context): Promise<unknown> {
    if (!n06Processor.supports(capability)) {
      const error = new Error(`CAPABILITY_NOT_EXECUTABLE: ${capability}`);
      (error as Error & { code?: string }).code = 'CAPABILITY_NOT_EXECUTABLE';
      throw error;
    }
    return n06Processor.execute({ capability: capability as Nucleus06Capability, input }, context);
  }
}

export const nucleus06CapabilityRuntime = new Nucleus06CapabilityRuntime();
