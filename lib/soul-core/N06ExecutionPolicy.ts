import { NUCLEUS_06_CAPABILITIES, supportsNucleus06Capability } from './Nucleus06Capabilities';

export interface N06ExecutionPolicy {
  maxSteps: number;
  allowedCapabilities: readonly string[];
}

export const DEFAULT_N06_EXECUTION_POLICY: N06ExecutionPolicy = {
  maxSteps: 5,
  allowedCapabilities: NUCLEUS_06_CAPABILITIES,
};

export function authorizeN06Capability(capability: string, policy = DEFAULT_N06_EXECUTION_POLICY): boolean {
  if (capability.startsWith('tool:')) return policy.allowedCapabilities.includes(capability);
  return supportsNucleus06Capability(capability) && policy.allowedCapabilities.includes(capability);
}

export function enforceN06Step(step: number, policy = DEFAULT_N06_EXECUTION_POLICY): void {
  if (!Number.isInteger(step) || step < 1 || step > policy.maxSteps) throw new Error(`N06_STEP_LIMIT:${policy.maxSteps}`);
}
