import { n06PeerMeshBridge } from './N06PeerMeshBridge';

export type N06ExternalCapabilityRequest = {
  capability: string;
  payload?: unknown;
  correlationId: string;
  traceId?: string;
  workloads?: unknown[];
  candidate?: Record<string, unknown>;
  strategy?: string;
};

export async function delegateN06ExternalCapability(
  request: N06ExternalCapabilityRequest,
): Promise<unknown> {
  const capability = request.capability.trim();
  if (!capability) throw new Error('N06_EXTERNAL_CAPABILITY_REQUIRED');
  const correlationId = request.correlationId.trim();
  if (!correlationId) throw new Error('N06_EXTERNAL_CORRELATION_REQUIRED');

  const result = await n06PeerMeshBridge.request(
    'N02',
    capability,
    {
      payload: request.payload ?? {},
      metadata: {
        prefrontal_orbital: 'true',
        workloads_json: JSON.stringify(request.workloads ?? []),
        candidate_json: JSON.stringify(request.candidate ?? { capability }),
        strategy: request.strategy ?? 'n06-external-tool-preflight',
      },
    },
    correlationId,
    request.traceId?.trim() || correlationId,
  );
  return result.payload;
}
