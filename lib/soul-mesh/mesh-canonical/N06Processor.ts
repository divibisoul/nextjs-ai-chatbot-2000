/** Canonical N06 processor facade. Legacy Nucleus05 implementations remain untouched. */
import { executeN06Capability } from '../N06CapabilityDispatcher';

export async function executeN06Processor(capability: string, payload: unknown) {
  return executeN06Capability(capability, payload);
}
