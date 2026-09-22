import type { Nucleus05Context } from './Nucleus05Processor';
import { nucleus05Processor } from './Nucleus05Processor';
import { NUCLEUS_05_TOOL_IDS, createNucleus05Tools, type Nucleus05ToolContext } from './Nucleus05ToolRegistry';
import { NUCLEUS_06_CAPABILITIES } from './Nucleus06Capabilities';
import { getN06Capabilities } from '@/lib/soul-mesh/N06CapabilityDispatcher';

/** Connects Mesh execution to the existing N06 tool implementations. */
export function attachNucleus05Tools(context: Nucleus05ToolContext) {
  const tools = createNucleus05Tools(context);
  if (!nucleus05Processor.listHandlers().includes('tool-execution')) {
    nucleus05Processor.registerHandler('tool-execution', async (input: unknown) => {
      const request = input as { toolId?: string; args?: unknown };
      if (!request.toolId || !NUCLEUS_05_TOOL_IDS.includes(request.toolId as Nucleus05ToolId)) throw new Error(`Unknown Nucleus 06 tool: ${request.toolId ?? 'undefined'}`);
      const toolDefinition = tools[request.toolId as keyof typeof tools];
      if (typeof toolDefinition?.execute !== 'function') throw new Error(`Tool is not executable: ${request.toolId}`);
      return toolDefinition.execute(request.args ?? {});
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
