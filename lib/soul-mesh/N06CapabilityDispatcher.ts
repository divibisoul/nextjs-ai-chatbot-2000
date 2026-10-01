import '@/lib/soul-core/N06NativeCapabilityRuntime';
import { n06Processor, type N06Context } from '@/lib/soul-core/N06Processor';
import { createNucleus06Tools, NUCLEUS_06_TOOL_IDS, type Nucleus06ToolContext } from '@/lib/soul-core/Nucleus05ToolRegistry';
import { authorizeN06Capability } from '@/lib/soul-core/N06ExecutionPolicy';
import { createMeshToolSession, meshDataStream } from './N06MeshToolContext';
import type { Nucleus06Capability } from '@/lib/soul-core/Nucleus06Capabilities';
import { getN06ExternalCapabilityCandidates, canonicalN02CapabilityForExternalSource } from '@/lib/soul-core/N06ExternalCapabilitySources';
import { delegateN06ExternalCapability } from './N06ExternalCapabilityBridge';

export type N06MeshExecutionContext = Partial<Nucleus06ToolContext> & { metadata?: Record<string, unknown> };
export function getN06Capabilities(): readonly string[] { return [...NUCLEUS_06_TOOL_IDS.map(id => `tool:${id}`), ...n06Processor.executableCapabilities()]; }

/**
 * Discovery-only catalog. Candidates returned here are NOT executable capabilities.
 * Execution remains exclusively owned by N06Processor/native handlers.
 */
export { getN06ExternalCapabilityCandidates };

const CONTEXTUAL_CAPABILITIES = new Set([
  ...NUCLEUS_06_TOOL_IDS.map(id => `tool:${id}`),
  'support.tool-execution',
  'support.artifacts',
  'support.documents',
]);

export function requiresN06MeshUserContext(capability: string): boolean {
  return CONTEXTUAL_CAPABILITIES.has(capability);
}

function withMeshToolContext(payload: unknown, context?: N06MeshExecutionContext): N06MeshExecutionContext {
  if (context?.session && context?.dataStream) return context;
  const value = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
  const userId = typeof value.userId === 'string' ? value.userId.trim() : '';
  const source = typeof context?.metadata?.source === 'string' ? context.metadata.source : 'MESH';
  const correlationId = typeof context?.metadata?.correlationId === 'string' ? context.metadata.correlationId : '';
  if (!userId) throw new Error('N06_MESH_USER_ID_REQUIRED');
  return {...context,session:createMeshToolSession({userId,source,correlationId}),dataStream:meshDataStream};
}

export async function executeN06ExternalCandidate(sourceId: string, payload: unknown, context?: N06MeshExecutionContext) {
  const capability = canonicalN02CapabilityForExternalSource(sourceId);
  if (!capability) throw new Error('N06_EXTERNAL_SOURCE_NOT_ACTIVATED:' + sourceId);
  return executeN06Capability('external-capability-execution', {
    capability,
    payload,
    sourceId,
  }, context);
}

export async function executeN06Capability(capability: string, payload: unknown, context?: N06MeshExecutionContext) {
  if (capability === 'external-capability-execution') {
    const value = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
    return delegateN06ExternalCapability({
      capability: String(value.capability ?? ''),
      payload: value.payload,
      correlationId: String(context?.metadata?.correlationId ?? crypto.randomUUID()),
      traceId: typeof context?.metadata?.traceId === 'string' ? context.metadata.traceId : undefined,
      workloads: Array.isArray(value.workloads) ? value.workloads : [],
      candidate: value.candidate && typeof value.candidate === 'object' ? value.candidate as Record<string, unknown> : { capability: String(value.capability ?? '') },
      strategy: typeof value.strategy === 'string' ? value.strategy : undefined,
    });
  }
  if (!authorizeN06Capability(capability)) throw new Error(`N06_CAPABILITY_DENIED:${capability}`);
  const effectiveContext = requiresN06MeshUserContext(capability) ? withMeshToolContext(payload, context) : context;
  if (capability.startsWith('tool:')) {
    const toolId = capability.slice(5);
    if (!(NUCLEUS_06_TOOL_IDS as readonly string[]).includes(toolId)) throw new Error(`UNKNOWN_TOOL:${toolId}`);
    const tools = createNucleus06Tools(effectiveContext as Nucleus06ToolContext);
    const tool = tools[toolId as keyof typeof tools] as { execute?: (args: unknown, options?: unknown) => unknown };
    if (typeof tool?.execute !== 'function') throw new Error(`TOOL_NOT_EXECUTABLE:${toolId}`);
    const args = payload && typeof payload === 'object' && 'args' in payload ? (payload as { args?: unknown }).args : payload;
    return tool.execute(args ?? {}, {});
  }
  if (n06Processor.supports(capability)) return n06Processor.execute({ capability: capability as Nucleus06Capability, input: payload }, effectiveContext as N06Context);
  throw new Error(`CAPABILITY_HANDLER_NOT_REGISTERED:${capability}`);
}

export const getNucleus05Capabilities = getN06Capabilities;
