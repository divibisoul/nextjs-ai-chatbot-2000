/** Canonical N06 processor facade. Legacy Nucleus05 implementations remain untouched. */
import { executeN06Capability } from '../N06CapabilityDispatcher';
import { persistN06Artifact } from '@/lib/storage/n06ArtifactStorage';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function artifactTypeFor(capability: string, payload: unknown): 'cognitive-synthesis' | 'audit-report' | 'artifact' | null {
  if (isRecord(payload)) {
    if (payload.auditReport === true || payload.artifactType === 'audit-report') return 'audit-report';
    if (payload.synthesis === true || payload.artifactType === 'cognitive-synthesis') return 'cognitive-synthesis';
    if (typeof payload.artifactType === 'string') return 'artifact';
  }
  if (capability === 'support.artifacts' || capability === 'support.context') return 'artifact';
  return null;
}

export async function executeN06Processor(capability: string, payload: unknown) {
  const result = await executeN06Capability(capability, payload);
  const artifactType = artifactTypeFor(capability, payload);

  if (artifactType) {
    try {
      const metadata = isRecord(payload)
        ? {
            correlationId: typeof payload.correlationId === 'string' ? payload.correlationId : undefined,
            capability,
          }
        : { capability };
      await persistN06Artifact({ content: result, type: artifactType, metadata });
    } catch {
      // Storage is an auxiliary persistence layer. A storage outage must not destroy
      // the primary N06 cognitive result or the existing Mesh execution contract.
    }
  }

  return result;
}
