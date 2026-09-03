import '@/lib/soul-core/N06NativeCapabilityRuntime';
import { n06CapabilityEngine, type N06EngineContext } from '@/lib/soul-core/N06CapabilityEngine';
import { createN06Tools, NUCLEUS_06_TOOL_IDS } from '@/lib/soul-core/N06ToolRegistry';
import type { N06ToolContext } from '@/lib/soul-core/N06ToolRegistry';
import { authorizeN06Capability } from '@/lib/soul-core/N06ExecutionPolicy';
import { createMeshToolSession, meshDataStream } from './N06MeshToolContext';

type N06MeshExecutionContext = Partial<N06ToolContext> & { metadata?: Record<string, unknown> };
export function getN06Capabilities(): readonly string[] {
  return [...NUCLEUS_06_TOOL_IDS.map((id) => `tool:${id}`), ...n06CapabilityEngine.executableCapabilities()];
}
const CONTEXTUAL_CAPABILITIES = new Set([
  ...NUCLEUS_06_TOOL_IDS.map((id) => `tool:${id}`),
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
  return { ...context, session: createMeshToolSession({ userId, source, correlationId }), dataStream: meshDataStream };
}
export async function executeN06Capability(capability: string, payload: unknown, context?: N06MeshExecutionContext) {
  if (!authorizeN06Capability(capability)) throw new Error(`N06_CAPABILITY_DENIED:${capability}`);
  const effectiveContext = CONTEXTUAL_CAPABILITIES.has(capability) ? withMeshToolContext(payload, context) : context;
  if (capability.startsWith('tool:')) {
    const toolId = capability.slice(5);
    if (!(NUCLEUS_06_TOOL_IDS as readonly string[]).includes(toolId)) throw new Error(`UNKNOWN_TOOL:${toolId}`);
    const tools = createN06Tools(effectiveContext as N06ToolContext);
    const tool = tools[toolId as keyof typeof tools] as { execute?: (args: unknown, options?: unknown) => unknown };
    if (typeof tool?.execute !== 'function') throw new Error(`TOOL_NOT_EXECUTABLE:${toolId}`);
    const args = payload && typeof payload === 'object' && 'args' in payload ? (payload as { args?: unknown }).args : payload;
    return tool.execute(args ?? {}, {});
  }
  if (n06CapabilityEngine.supports(capability)) return n06CapabilityEngine.execute(capability, payload, effectiveContext as N06EngineContext);
  throw new Error(`CAPABILITY_HANDLER_NOT_REGISTERED:${capability}`);
}

/** @deprecated Use getN06Capabilities; retained for legacy Mesh consumers. */
export const getNucleus05Capabilities = getN06Capabilities;
