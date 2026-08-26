import type { Nucleus05Context } from '../soul-core/Nucleus05Processor';
import { nucleus05Processor } from '../soul-core/Nucleus05Processor';
import { attachNucleus05Tools } from '../soul-core/Nucleus05Runtime';

/**
 * Bridges the existing N06 runtime into Soul Mesh without replacing the
 * nucleus runtime or making transport depend on an external AI API.
 */
export class N06RuntimeMeshBridge {
  constructor(private readonly context?: Nucleus05Context) {}

  attachTools(toolContext: Parameters<typeof attachNucleus05Tools>[0]) {
    attachNucleus05Tools(toolContext);
    return this;
  }

  hasCapability(capability: string): boolean {
    return nucleus05Processor.listHandlers().includes(capability);
  }

  async execute(capability: string, input: unknown) {
    if (!this.hasCapability(capability)) {
      throw new Error(`N06_CAPABILITY_NOT_REGISTERED:${capability}`);
    }
    return nucleus05Processor.execute({ capability, input }, this.context);
  }

  capabilities(): string[] {
    return nucleus05Processor.listHandlers();
  }
}
