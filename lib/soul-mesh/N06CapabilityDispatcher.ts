import '@/lib/soul-core/N06NativeCapabilityRuntime';
import { n06Processor, type N06Context } from '@/lib/soul-core/N06Processor';
import { createNucleus06Tools, NUCLEUS_06_TOOL_IDS, type Nucleus06ToolContext } from '@/lib/soul-core/Nucleus05ToolRegistry';
import { authorizeN06Capability } from '@/lib/soul-core/N06ExecutionPolicy';
import type { N06Capability } from '@/lib/soul-core/Nucleus06Capabilities';
import { persistN06Artifact } from '@/lib/storage/n06ArtifactStorage';

export type N06MeshExecutionContext = Partial<Nucleus06ToolContext> & { metadata?: Record<string, unknown> };

export function getN06Capabilities(): readonly string[] {
  return [...NUCLEUS_06_TOOL_IDS.map(id => `tool:${id}`), ...n06Processor.capabilities];
}

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

async function persistArtifactIfRequested(capability: string, payload: unknown, result: unknown): Promise<void> {
  const type = artifactTypeFor(capability, payload);
  if (!type) return;
  try {
    const metadata = isRecord(payload)
      ? {
          correlationId: typeof payload.correlationId === 'string' ? payload.correlationId : undefined,
          capability,
        }
      : { capability };
    await persistN06Artifact({ content: result, type, metadata });
  } catch {
    // Persistence is auxiliary; a storage outage must not break the existing Mesh result.
  }
}

export async function executeN06Capability(capability: string, payload: unknown, context?: N06MeshExecutionContext) {
  if (!authorizeN06Capability(capability)) throw new Error(`N06_CAPABILITY_DENIED:${capability}`);

  if (capability.startsWith('tool:')) {
    const toolId = capability.slice(5);
    if (!(NUCLEUS_06_TOOL_IDS as readonly string[]).includes(toolId)) throw new Error(`UNKNOWN_TOOL:${toolId}`);
    if (!context?.session || !context?.dataStream) throw new Error('N06_TOOL_CONTEXT_REQUIRED');
    const tools = createNucleus06Tools(context as Nucleus06ToolContext);
    const tool = tools[toolId as keyof typeof tools] as { execute?: (args: unknown) => unknown };
    if (typeof tool?.execute !== 'function') throw new Error(`TOOL_NOT_EXECUTABLE:${toolId}`);
    const args = payload && typeof payload === 'object' && 'args' in payload
      ? (payload as { args?: unknown }).args
      : payload;
    const result = await tool.execute(args ?? {});
    await persistArtifactIfRequested(capability, payload, result);
    return result;
  }

  if (n06Processor.supports(capability)) {
    const result = await n06Processor.execute(
      { capability: capability as N06Capability, input: payload },
      context as N06Context,
    );
    await persistArtifactIfRequested(capability, payload, result);
    return result;
  }

  throw new Error(`CAPABILITY_HANDLER_NOT_REGISTERED:${capability}`);
}

export const getNucleus05Capabilities = getN06Capabilities;
