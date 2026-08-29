import { activateNucleus06Runtime } from '@/lib/soul-core/Nucleus05Runtime';
import { nucleus06Processor } from '@/lib/soul-core/Nucleus05Processor';
import { NUCLEUS_05_TOOL_IDS, createNucleus05Tools, type Nucleus05ToolContext } from '@/lib/soul-core/Nucleus05ToolRegistry';
import { supportsNucleus05Capability } from '@/lib/soul-core/Nucleus05Capabilities';
import { getWeather } from '@/lib/ai/tools/get-weather';

export type N06MeshExecutionContext = Partial<Nucleus05ToolContext> & { metadata?: Record<string, unknown> };

export function getN06Capabilities(): readonly string[] {
  return [...NUCLEUS_05_TOOL_IDS.map((id) => `tool:${id}`), ...nucleus06Processor.capabilities];
}

function requireToolContext(context?: N06MeshExecutionContext): Nucleus05ToolContext {
  if (!context?.session || !context?.dataStream) throw new Error('N06_TOOL_CONTEXT_REQUIRED');
  return { session: context.session, dataStream: context.dataStream };
}

export async function executeN06Capability(capability: string, payload: unknown, context?: N06MeshExecutionContext) {
  activateNucleus06Runtime();

  if (capability === 'tool:getWeather') {
    const args = payload && typeof payload === 'object' && 'args' in payload ? (payload as { args?: unknown }).args : payload;
    return getWeather.execute(args as never);
  }

  if (capability.startsWith('tool:')) {
    const toolId = capability.slice('tool:'.length);
    if (!NUCLEUS_05_TOOL_IDS.includes(toolId as (typeof NUCLEUS_05_TOOL_IDS)[number])) throw new Error(`N06_UNKNOWN_TOOL:${toolId}`);
    const tools = createNucleus05Tools(requireToolContext(context));
    const tool = tools[toolId as keyof typeof tools] as { execute?: (args: unknown) => Promise<unknown> | unknown };
    if (typeof tool?.execute !== 'function') throw new Error(`N06_TOOL_NOT_EXECUTABLE:${toolId}`);
    const args = payload && typeof payload === 'object' && 'args' in payload ? (payload as { args?: unknown }).args : payload;
    return tool.execute(args ?? {});
  }

  if (supportsNucleus05Capability(capability)) {
    return nucleus06Processor.execute({ capability: capability as never, input: payload }, context);
  }

  throw new Error(`N06_CAPABILITY_NOT_REGISTERED:${capability}`);
}

export const getNucleus05Capabilities = getN06Capabilities;
