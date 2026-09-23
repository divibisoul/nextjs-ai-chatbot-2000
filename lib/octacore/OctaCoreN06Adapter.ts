import { executeN06Capability } from '@/lib/soul-mesh/N06CapabilityDispatcher';
import { authorizeN06Capability } from '@/lib/soul-core/N06ExecutionPolicy';
import { n06Processor, type N06Context } from '@/lib/soul-core/N06Processor';

export type OctaCoreN06Request = {
  capability: string;
  payload: unknown;
  job_id?: string;
  correlation_id?: string;
};

export async function executeOctaCoreN06(
  request: OctaCoreN06Request,
  context?: N06Context,
) {
  if (!request || typeof request !== 'object') {
    throw new Error('OCTACORE_N06_REQUEST_REQUIRED');
  }

  const capability = request.capability?.trim();
  if (!capability || capability === 'octacore.execute') {
    throw new Error('OCTACORE_N06_INNER_CAPABILITY_INVALID');
  }

  if (!n06Processor.supports(capability)) {
    throw new Error('OCTACORE_N06_CAPABILITY_NOT_DECLARED:' + capability);
  }

  if (!authorizeN06Capability(capability)) {
    throw new Error('OCTACORE_N06_CAPABILITY_DENIED:' + capability);
  }

  const value = await executeN06Capability(capability, request.payload, context);

  return {
    ok: true,
    nucleus: 'N06' as const,
    capability,
    correlationId: request.correlation_id ?? null,
    jobId: request.job_id ?? null,
    value,
  };
}
