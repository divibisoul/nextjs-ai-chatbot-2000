import { nucleus05Processor } from '@/lib/soul-core/Nucleus05Processor';
import { createNucleus05Tools, NUCLEUS_05_TOOL_IDS, type Nucleus05ToolContext } from '@/lib/soul-core/Nucleus05ToolRegistry';

export type N06MeshExecutionContext = Partial<Nucleus05ToolContext> & { metadata?: Record<string, unknown> };

/** Mesh -> N06 runtime bridge. Reuses native AI/tool implementations without replacing them. */
export async function executeN06Capability(capability: string, payload: unknown, context?: N06MeshExecutionContext) {
  if (capability === 'ai-pilot') return nucleus05Processor.execute({ capability: 'ai-pilot', input: payload }, context);

  if (capability === 'tool-execution') {
    const input = (payload && typeof payload === 'object' ? payload : {}) as { toolId?: string; args?: unknown };
    if (!input.toolId || !NUCLEUS_05_TOOL_IDS.includes(input.toolId as any)) throw new Error(`UNKNOWN_TOOL:${input.toolId ?? ''}`);
    if (!context?.session || !context?.dataStream) throw new Error('N06_TOOL_CONTEXT_REQUIRED');
    const tools = createNucleus05Tools(context as Nucleus05ToolContext);
    const tool = tools[input.toolId as keyof typeof tools] as any;
    if (typeof tool?.execute !== 'function') throw new Error(`TOOL_NOT_EXECUTABLE:${input.toolId}`);
    return tool.execute(input.args ?? {});
  }

  if (nucleus05Processor.supports(capability)) return nucleus05Processor.execute({ capability: capability as any, input: payload }, context);
  throw new Error(`CAPABILITY_HANDLER_NOT_REGISTERED:${capability}`);
}
