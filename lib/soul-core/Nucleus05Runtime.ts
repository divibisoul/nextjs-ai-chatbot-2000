import type { Nucleus05Context } from './Nucleus05Processor';
import { nucleus05Processor } from './Nucleus05Processor';
import { n06Processor } from './N06Processor';
import { NUCLEUS_05_TOOL_IDS, createNucleus05Tools, type Nucleus05ToolContext, type Nucleus05ToolId } from './Nucleus05ToolRegistry';
import { NUCLEUS_06_CAPABILITIES } from './Nucleus06Capabilities';
import { getN06Capabilities } from '@/lib/soul-mesh/N06CapabilityDispatcher';

/** Connects Mesh execution to the existing N06 tool implementations. */
export function attachNucleus05Tools(context: Nucleus05ToolContext) {
  const tools = createNucleus05Tools(context);
  if (!n06Processor.listHandlers().includes('support.tool-execution')) {
    n06Processor.registerHandler('support.tool-execution', async (input: unknown) => {
      const request = input as { toolId?: string; args?: unknown };
      const toolId = typeof request.toolId === 'string'
        ? NUCLEUS_05_TOOL_IDS.find((id) => id === request.toolId)
        : undefined;
      if (!toolId) {
        throw new Error(`Unknown Nucleus 06 tool: ${request.toolId ?? 'undefined'}`);
      }
      const toolDefinition = tools[toolId];
      if (!toolDefinition || typeof toolDefinition.execute !== 'function') {
        throw new Error(`Tool is not executable: ${toolId}`);
      }
      return Reflect.apply(toolDefinition.execute, toolDefinition, [
        request.args ?? {},
        { toolCallId: crypto.randomUUID(), messages: [] },
      ]);
    });
  }
  return nucleus05Processor;
}

export function executeNucleus05Capability(input: unknown, context?: Nucleus05Context) {
  return nucleus05Processor.execute({ capability: 'tool-execution', input }, context);
}


/** Compatibility exports for the historical N06 handshake boundary. */
export function getN06DeclaredCapabilities(): readonly string[] {
  return Object.freeze([
    ...NUCLEUS_06_CAPABILITIES,
    ...NUCLEUS_05_TOOL_IDS.map((id) => `tool:${id}`),
  ]);
}

export function getN06ExecutableCapabilities(): readonly string[] {
  return Object.freeze(getN06Capabilities());
}
