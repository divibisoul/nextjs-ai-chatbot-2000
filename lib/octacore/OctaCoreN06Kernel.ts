import { executeN06Capability, type N06MeshExecutionContext } from '@/lib/soul-mesh/N06CapabilityDispatcher';
import { n06Processor } from '@/lib/soul-core/N06Processor';
import { NUCLEUS_06_CAPABILITIES } from '@/lib/soul-core/Nucleus06Capabilities';

export interface OctaCoreN06Request {
  capability: string;
  payload: unknown;
  job_id?: string;
  correlation_id: string;
}

export async function executeOctaCoreN06(
  request: OctaCoreN06Request,
  context?: N06MeshExecutionContext,
) {
  if (!request || typeof request !== 'object') {
    throw new Error('OCTACORE_N06_REQUEST_REQUIRED');
  }

  const capability = request.capability?.trim();
  if (!capability) throw new Error('OCTACORE_N06_CAPABILITY_REQUIRED');

  const declared = (NUCLEUS_06_CAPABILITIES as readonly string[]).includes(capability);
  const executable = n06Processor.executableCapabilities().includes(capability as never);
  if (!declared) {
    throw new Error(`OCTACORE_N06_CAPABILITY_NOT_DECLARED:${capability}`);
  }
  if (!executable && capability !== 'support.ai-pilot') {
    throw new Error(`OCTACORE_N06_CAPABILITY_NOT_EXECUTABLE:${capability}`);
  }

  const value = await executeN06Capability(capability, request.payload, {
    ...(context ?? {}),
    metadata: {
      ...(context?.metadata ?? {}),
      octacore: true,
      job_id: request.job_id ?? null,
      correlationId: request.correlation_id,
    },
  });

  return {
    ok: true,
    nucleus: 'N06' as const,
    capability,
    job_id: request.job_id ?? null,
    correlation_id: request.correlation_id,
    result: value,
  };
}
