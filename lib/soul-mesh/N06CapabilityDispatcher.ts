import '@/lib/soul-core/N06NativeCapabilityRuntime';
import { n06Processor, type N06Context } from '@/lib/soul-core/N06Processor';
import { createNucleus06Tools, NUCLEUS_06_TOOL_IDS, type Nucleus06ToolContext } from '@/lib/soul-core/Nucleus05ToolRegistry';
import { supportsNucleus06Capability } from '@/lib/soul-core/N06Capabilities';
import { authorizeN06Capability } from '@/lib/soul-core/N06ExecutionPolicy';

export type N06MeshExecutionContext = Partial<Nucleus06ToolContext> & { metadata?: Record<string, unknown> };

export function getN06Capabilities(): readonly string[] {
  return [...NUCLEUS_06_TOOL_IDS.map((id) => `tool:${id}`), ...n06Processor.capabilities];
}

export async function executeN06Capability(capability: string, payload: unknown, context?: N06MeshExecutionContext) {
  if (!authorizeN06Capability(capability)) throw new Error(`N06_CAPABILITY_DENIED:${capability}`);
  if (capability.startsWith('tool:')) {
    const toolId = capability.slice('tool:'.length);
    if (!NUCLEUS_06_TOOL_IDS.includes(toolId as never)) throw new Error(`UNKNOWN_TOOL:${toolId}`);
    if (!context?.session || !context?.dataStream) throw new Error('N06_TOOL_CONTEXT_REQUIRED');
    const tools = createNucleus06Tools(context as Nucleus06ToolContext);
    const tool = tools[toolId as keyof typeof tools] as { execute?: (args: unknown) => unknown };
    if (typeof tool?.execute !== 'function') throw new Error(`TOOL_NOT_EXECUTABLE:${toolId}`);
    const args = payload && typeof payload === 'object' && 'args' in payload ? (payload as { args?: unknown }).args : payload;
    return tool.execute(args ?? {});
  }
  if (supportsNucleus06Capability(capability)) return n06Processor.execute({ capability, input: payload }, context as N06Context);
  throw new Error(`CAPABILITY_HANDLER_NOT_REGISTERED:${capability}`);
}

export const getNucleus05Capabilities = getN06Capabilities;
