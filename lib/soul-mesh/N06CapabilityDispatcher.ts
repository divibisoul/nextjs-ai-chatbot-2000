import { nucleus05Processor } from '@/lib/soul-core/Nucleus05Processor';
import { createNucleus06Tools, NUCLEUS_06_TOOL_IDS, type Nucleus06ToolContext } from '@/lib/soul-core/Nucleus05ToolRegistry';

export type N06MeshExecutionContext = Partial<Nucleus06ToolContext> & { metadata?: Record<string, unknown> };

/** Capabilities are discovered from the native N06 runtime/tool registry. */
export function getN06Capabilities(): readonly string[] {
  return [...NUCLEUS_06_TOOL_IDS.map((id) => `tool:${id}`), 'ai-pilot'];
}

/** Mesh -> N06 runtime bridge. Native tools remain the source of truth. */
export async function executeN06Capability(capability: string, payload: unknown, context?: N06MeshExecutionContext) {
  if (capability === 'ai-pilot') return nucleus05Processor.execute({ capability: 'ai-pilot', input: payload }, context);
  if (capability.startsWith('tool:')) {
    const toolId = capability.slice('tool:'.length);
    if (!NUCLEUS_06_TOOL_IDS.includes(toolId as any)) throw new Error(`UNKNOWN_TOOL:${toolId}`);
    if (!context?.session || !context?.dataStream) throw new Error('N06_TOOL_CONTEXT_REQUIRED');
    const tools = createNucleus06Tools(context as Nucleus06ToolContext);
    const tool = tools[toolId as keyof typeof tools] as any;
    if (typeof tool?.execute !== 'function') throw new Error(`TOOL_NOT_EXECUTABLE:${toolId}`);
    const args = payload && typeof payload === 'object' && 'args' in payload ? (payload as { args?: unknown }).args : payload;
    return tool.execute(args ?? {});
  }
  if (nucleus05Processor.supports(capability)) return nucleus05Processor.execute({ capability: capability as any, input: payload }, context);
  throw new Error(`CAPABILITY_HANDLER_NOT_REGISTERED:${capability}`);
}

/** Compatibility entry point for existing callers. */
export const getNucleus05Capabilities = getN06Capabilities;
