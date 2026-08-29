import type { Nucleus05Context } from './Nucleus05Processor';
import { nucleus05Processor } from './Nucleus05Processor';
import { NUCLEUS_05_TOOL_IDS, createNucleus05Tools, type Nucleus05ToolContext } from './Nucleus05ToolRegistry';

function requireToolContext(context?: Nucleus05Context): Nucleus05ToolContext {
  if (!context?.session || !context?.dataStream) throw new Error('N06_TOOL_CONTEXT_REQUIRED');
  return { session: context.session as Nucleus05ToolContext['session'], dataStream: context.dataStream as Nucleus05ToolContext['dataStream'] };
}

function registerOnce(capability: Parameters<typeof nucleus05Processor.registerHandler>[0], handler: Parameters<typeof nucleus05Processor.registerHandler>[1]) {
  if (!nucleus05Processor.listHandlers().includes(capability)) nucleus05Processor.registerHandler(capability, handler);
}

export function activateNucleus06Runtime() {
  registerOnce('tool-execution', async (input, context) => {
    const request = (input && typeof input === 'object' ? input : {}) as { toolId?: string; args?: unknown };
    if (!request.toolId || !NUCLEUS_05_TOOL_IDS.includes(request.toolId as (typeof NUCLEUS_05_TOOL_IDS)[number])) throw new Error(`N06_UNKNOWN_TOOL:${request.toolId ?? 'undefined'}`);
    const tools = createNucleus05Tools(requireToolContext(context));
    const tool = tools[request.toolId as keyof typeof tools] as { execute?: (args: unknown) => Promise<unknown> | unknown };
    if (typeof tool?.execute !== 'function') throw new Error(`N06_TOOL_NOT_EXECUTABLE:${request.toolId}`);
    return tool.execute(request.args ?? {});
  });

  registerOnce('artifact-processing', async (input, context) => {
    const request = (input && typeof input === 'object' ? input : {}) as { action?: 'create' | 'update'; title?: string; kind?: string; id?: string; description?: string };
    const tools = createNucleus05Tools(requireToolContext(context));
    if (request.action === 'update') return (tools.updateDocument as any).execute({ id: request.id ?? '', description: request.description ?? '' });
    return (tools.createDocument as any).execute({ title: request.title ?? 'Untitled', kind: request.kind });
  });

  registerOnce('document-processing', async (input, context) => {
    const request = (input && typeof input === 'object' ? input : {}) as { action?: 'create' | 'update'; title?: string; kind?: string; id?: string; description?: string };
    const tools = createNucleus05Tools(requireToolContext(context));
    if (request.action === 'update') return (tools.updateDocument as any).execute({ id: request.id ?? '', description: request.description ?? '' });
    return (tools.createDocument as any).execute({ title: request.title ?? 'Untitled', kind: request.kind });
  });

  registerOnce('context-orchestration', async (input, context) => ({ nucleus: 'N06', input, metadata: context?.metadata ?? {} }));
  registerOnce('streaming', async (input, context) => {
    if (context?.dataStream && typeof (context.dataStream as any).write === 'function') (context.dataStream as any).write({ type: 'data-kind', data: 'n06-stream', transient: true });
    return input;
  });
  registerOnce('mesh-communication', async (input) => ({ nucleus: 'N06', protocol: 'soul-mesh/1', accepted: true, payload: input }));
  return nucleus05Processor;
}

export function getN06DeclaredCapabilities(): readonly string[] {
  return [...nucleus05Processor.capabilities];
}

export function getN06ExecutableCapabilities(): readonly string[] {
  activateNucleus06Runtime();
  return [...nucleus05Processor.executableCapabilities()];
}

export function attachNucleus05Tools(context: Nucleus05ToolContext) {
  activateNucleus06Runtime();
  return nucleus05Processor;
}

export function executeNucleus05Capability(input: unknown, context?: Nucleus05Context) {
  activateNucleus06Runtime();
  return nucleus05Processor.execute({ capability: 'tool-execution', input }, context);
}

activateNucleus06Runtime();
