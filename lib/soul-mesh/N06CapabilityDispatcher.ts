import '@/lib/soul-core/N06NativeCapabilityRuntime';
import { n06Processor, type N06Context } from '@/lib/soul-core/N06Processor';
import { createNucleus06Tools, NUCLEUS_06_TOOL_IDS, type Nucleus06ToolContext } from '@/lib/soul-core/Nucleus05ToolRegistry';
import { authorizeN06Capability } from '@/lib/soul-core/N06ExecutionPolicy';
import { createMeshToolSession, meshDataStream } from './N06MeshToolContext';
import type { N06Capability } from '@/lib/soul-core/Nucleus06Capabilities';

export type N06MeshExecutionContext = Partial<Nucleus06ToolContext> & { metadata?: Record<string, unknown> };

export function getN06Capabilities(): readonly string[] {
  return [...NUCLEUS_06_TOOL_IDS.map(id => `tool:${id}`), ...n06Processor.executableCapabilities()];
}

const CONTEXTUAL_CAPABILITIES = new Set([
  ...NUCLEUS_06_TOOL_IDS.map(id => `tool:${id}`),
  'support.tool-execution',
  'support.artifacts',
  'support.documents',
]);

function withMeshToolContext(payload: unknown, context?: N06MeshExecutionContext): N06MeshExecutionContext {
  if (context?.session && context?.dataStream) return context;
  const value = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
  const userId = typeof value.userId === 'string' ? value.userId.trim() : '';
  const source = typeof context?.metadata?.source === 'string' ? context.metadata.source : 'MESH';
  const correlationId = typeof context?.metadata?.correlationId === 'string' ? context.metadata.correlationId : '';
  if (!userId) throw new Error('N06_MESH_USER_ID_REQUIRED');
  return {
    ...context,
    session: createMeshToolSession({ userId, source, correlationId }),
    dataStream: meshDataStream,
  };
}

export async function executeN06Capability(capability: string, payload: unknown, context?: N06MeshExecutionContext) {
  if (!authorizeN06Capability(capability)) throw new Error(`N06_CAPABILITY_DENIED:${capability}`);
  const effectiveContext = CONTEXTUAL_CAPABILITIES.has(capability)
    ? withMeshToolContext(payload, context)
    : context;

  if (capability.startsWith('tool:')) {
    const toolId = capability.slice(5);
    if (!(NUC​LEUS_06_TOOL_IDS as readonly string[]).includes(toolId)) throw new Error(`UNKNOWN_TOOL:${toolId}`);
    const tools = createNucleus06Tools(effectiveContext as Nucleus06ToolContext);
    const tool = tools[toolId as keyof typeof tools] as { execute?: (args: unknown) => unknown };
    if (typeof tool?.execute !== 'function') throw new Error(`TOOL_NOT_EXECUTABLE:${toolId}`);
    const args = payload && typeof payload === 'object' && 'args' in payload ? (payload as { args?: unknown }).args : payload;
    return tool.execute(args ?? {});
  }
  if (n06Processor.supports(capability)) {
    return n06Processor.execute({ capability: capability as N06Capability, input: payload }, effectiveContext as N06Context);
  }
  throw new Error(`CAPABILITY_HANDLER_NOT_REGISTERED:${capability}`);
}

export const getNucleus05Capabilities = getN06Capabilities;
