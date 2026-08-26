import { nucleus05Processor } from '../soul-core/Nucleus05Processor';

/** Keeps local ownership explicit: Mesh may invoke only capabilities registered by N06. */
export class N06CapabilityExecutionPolicy {
  canExecuteLocally(capability: string): boolean {
    return nucleus05Processor.listHandlers().includes(capability);
  }

  assertLocal(capability: string): void {
    if (!this.canExecuteLocally(capability)) {
      throw new Error(`N06_LOCAL_CAPABILITY_NOT_AVAILABLE:${capability}`);
    }
  }

  listLocalCapabilities(): string[] {
    return nucleus05Processor.listHandlers();
  }
}
