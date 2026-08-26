import { nucleus05Processor } from '@/lib/soul-core/Nucleus05Processor';
import { createNucleus05Tools } from '@/lib/soul-core/Nucleus05ToolRegistry';
import type { Session } from 'next-auth';
import type { UIMessageStreamWriter } from 'ai';
import type { ChatMessage } from '@/lib/types';

export type N06MeshExecutionContext = { session: Session; dataStream: UIMessageStreamWriter<ChatMessage> };

/** Bridges Mesh to the existing N06 capability/tool runtime without duplicating implementations. */
export async function executeN06Capability(capability: string, payload: unknown, context: N06MeshExecutionContext) {
  const tools = createNucleus05Tools(context);
  if (nucleus05Processor.listHandlers().includes(capability)) return nucleus05Processor.execute(capability, payload);
  if (capability === 'tool-execution') {
    const input = payload as { toolId?: string; args?: unknown };
    if (!input?.toolId || !(input.toolId in tools)) throw new Error(`UNKNOWN_TOOL:${input?.toolId ?? ''}`);
    const tool = tools[input.toolId as keyof typeof tools] as any;
    if (typeof tool?.execute !== 'function') throw new Error(`TOOL_NOT_EXECUTABLE:${input.toolId}`);
    return tool.execute(input.args ?? {});
  }
  throw new Error(`CAPABILITY_HANDLER_NOT_REGISTERED:${capability}`);
}
