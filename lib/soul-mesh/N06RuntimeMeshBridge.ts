import type { Nucleus05Context } from '../soul-core/Nucleus05Processor';
import { nucleus05Processor } from '../soul-core/Nucleus05Processor';
import { attachNucleus05Tools } from '../soul-core/Nucleus05Runtime';

/** Bridges the existing N06 runtime into Soul Mesh. */
export class N06RuntimeMeshBridge {
  constructor(private readonly context?: Nucleus05Context) {}

  attachTools(toolContext: Parameters<typeof attachNucleus05Tools>[0]): this {
    attachNucleus05Tools(toolContext);
    return this;
  }

  supports(capability: string): boolean {
    return nucleus05Processor.supports(capability);
  }

  canExecute(capability: string): boolean {
    return nucleus05Processor.executableCapabilities().includes(capability as never);
  }

  async execute(capability: string, input: unknown) {
    if (!this.supports(capability)) throw new Error(`N06_CAPABILITY_NOT_SUPPORTED:${capability}`);
    if (!this.canExecute(capability)) throw new Error(`N06_CAPABILITY_NOT_READY:${capability}`);
    return nucleus05Processor.execute({ capability: capability as never, input }, this.context);
  }

  capabilities(): string[] {
    return [...nucleus05Processor.executableCapabilities()];
  }
}
