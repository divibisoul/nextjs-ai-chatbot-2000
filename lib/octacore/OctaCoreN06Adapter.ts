import { executeN06Capability, type N06MeshExecutionContext } from '@/lib/soul-mesh/N06CapabilityDispatcher';
import { authorizeN06Capability } from '@/lib/soul-core/N06ExecutionPolicy';
import { NUCLEUS_06_CAPABILITIES, type Nucleus06Capability } from '@/lib/soul-core/Nucleus06Capabilities';

export type OctaCoreN06Request = {
  capability: string;
  payload: unknown;
  job_id?: string;
  correlation_id?: string;
};

export async function executeOctaCoreN06(request: OctaCoreN06Request, context?: N06MeshExecutionContext) {
  if (!request || typeof request !== 'object') throw new Error('OCTACORE_N06_REQUEST_REQUIRED');
  const capability = request.capability?.trim();
  if (!capability || !(NUCLEUS_06_CAPABILITIES as readonly string[]).includes(capability)) {
    throw new Error(`OCTACORE_N06_CAPABILITY_NOT_DECLARED:${capability ?? ''}`);
  }
  if (!authorizeN06Capability(capability)) throw new Error(`OCTACORE_N06_CAPABILITY_DENIED:${capability}`);
  const value = await executeN06Capability(capability as Nucleus06Capability, request.payload, context);
  return {
    ok: true,
    nucleus: 'N06' as const,
    capability,
    correlationId: request.correlation_id ?? null,
    jobId: request.job_id ?? null,
    value,
  };
}
