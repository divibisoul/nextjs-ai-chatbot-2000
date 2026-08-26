import type { Nucleus05Capability, Nucleus05Context, Nucleus05Request } from '../soul-core/Nucleus05Processor';
import { nucleus05Processor } from '../soul-core/Nucleus05Processor';

/** Keeps N06 execution local while allowing the Mesh to delegate explicitly. */
export class N06CapabilityBoundary {
  supports(capability: string): capability is Nucleus05Capability {
    return nucleus05Processor.supports(capability);
  }

  executableCapabilities(): readonly Nucleus05Capability[] {
    return nucleus05Processor.executableCapabilities();
  }

  async execute(request: Nucleus05Request, context?: Nucleus05Context): Promise<unknown> {
    return nucleus05Processor.execute(request, context);
  }
}

export const n06CapabilityBoundary = new N06CapabilityBoundary();
