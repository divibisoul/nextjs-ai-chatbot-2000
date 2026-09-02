import type { Nucleus05Context } from './Nucleus05Processor';
import { nucleus05Processor } from './Nucleus05Processor';
import { NUCLEUS_06_TOOL_IDS, createN06Tools, type N06ToolContext } from './N06ToolRegistry';

/** @deprecated Compatibility facade for the historical Nucleus05 runtime. */
export function attachNucleus05Tools(context: N06ToolContext) {
  const tools = createN06Tools(context);
  if (!nucleus05Processor.listHandlers().includes('support.tool-execution')) {
    nucleus05Processor.registerHandler('support.tool-execution', async (input: unknown) => {
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('N06_TOOL_REQUEST_MUST_BE_OBJECT');
      const request = input as { toolId?: string; args?: unknown };
      const toolId = request.toolId ?? '';
      if (!(NUCLEUS_06_TOOL_IDS as readonly string[]).includes(toolId)) throw new Error(`Unknown Nucleus 06 tool: ${toolId || 'undefined'}`);
      const toolDefinition = tools[toolId as keyof typeof tools];
      if (!toolDefinition || typeof toolDefinition !== 'object' || !('execute' in toolDefinition) || typeof toolDefinition.execute !== 'function') throw new Error(`Tool is not executable: ${toolId}`);
      return toolDefinition.execute(request.args ?? {}, {});
    });
  }
  return nucleus05Processor;
}

export function executeNucleus05Capability(input: unknown, context?: Nucleus05Context) {
  return nucleus05Processor.execute({ capability: 'tool-execution', input }, context);
}
