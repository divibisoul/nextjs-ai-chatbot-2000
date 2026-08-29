import { generateText } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import type { Nucleus06Context, Nucleus06Handler } from './Nucleus05Processor';
import { nucleus06Processor } from './Nucleus05Processor';
import { NUCLEUS_06_CAPABILITIES, type Nucleus06Capability } from './Nucleus06Capabilities';
import { NUCLEUS_05_TOOL_IDS, createNucleus05Tools, type Nucleus05ToolContext } from './Nucleus05ToolRegistry';

function requireToolContext(context?: Nucleus06Context): Nucleus05ToolContext {
  if (!context?.session || !context?.dataStream) throw new Error('N06_TOOL_CONTEXT_REQUIRED');
  return { session: context.session as Nucleus05ToolContext['session'], dataStream: context.dataStream as Nucleus05ToolContext['dataStream'] };
}

function registerOnce(capability: Nucleus06Capability, handler: Nucleus06Handler) {
  if (!nucleus06Processor.listHandlers().includes(capability)) nucleus06Processor.registerHandler(capability, handler);
}

export function activateNucleus06Runtime() {
  if (!nucleus06Processor.getPilot()) {
    nucleus06Processor.registerPilot({
      id: 'n06-native-ai-pilot',
      async execute(input, context) {
        const prompt = typeof input === 'string' ? input : JSON.stringify(input ?? {});
        const result = await generateText({
          model: myProvider.languageModel('chat-model'),
          system: 'You are the native AI pilot of Soul Nucleus N06. Return useful answers and never claim an external action was executed unless a real tool/runtime executed it.',
          prompt: context?.metadata ? `${prompt}\n\nContext:\n${JSON.stringify(context.metadata)}` : prompt,
        });
        return { text: result.text, nucleus: 'N06', pilot: 'n06-native-ai-pilot' };
      },
    });
  }

  registerOnce('support.ai-pilot', async (input, context) => nucleus06Processor.getPilot()!.execute(input, context));
  registerOnce('support.tool-execution', async (input, context) => {
    const request = (input && typeof input === 'object' ? input : {}) as { toolId?: string; args?: unknown };
    if (!request.toolId || !NUCLEUS_05_TOOL_IDS.includes(request.toolId as (typeof NUCLEUS_05_TOOL_IDS)[number])) throw new Error(`N06_UNKNOWN_TOOL:${request.toolId ?? 'undefined'}`);
    const tools = createNucleus05Tools(requireToolContext(context));
    const tool = tools[request.toolId as keyof typeof tools] as { execute?: (args: unknown) => Promise<unknown> | unknown };
    if (typeof tool?.execute !== 'function') throw new Error(`N06_TOOL_NOT_EXECUTABLE:${request.toolId}`);
    return tool.execute(request.args ?? {});
  });
  registerOnce('support.artifacts', async (input, context) => {
    const request = (input && typeof input === 'object' ? input : {}) as { action?: 'create' | 'update'; title?: string; kind?: string; id?: string; description?: string };
    const tools = createNucleus05Tools(requireToolContext(context));
    if (request.action === 'update') return tools.updateDocument.execute({ id: request.id ?? '', description: request.description ?? '' });
    return tools.createDocument.execute({ title: request.title ?? 'Untitled', kind: request.kind });
  });
  registerOnce('support.documents', async (input, context) => {
    const request = (input && typeof input === 'object' ? input : {}) as { action?: 'create' | 'update'; title?: string; kind?: string; id?: string; description?: string };
    const tools = createNucleus05Tools(requireToolContext(context));
    if (request.action === 'update') return tools.updateDocument.execute({ id: request.id ?? '', description: request.description ?? '' });
    return tools.createDocument.execute({ title: request.title ?? 'Untitled', kind: request.kind });
  });
  registerOnce('support.context', async (input, context) => ({ nucleus: 'N06', input, metadata: context?.metadata ?? {} }));
  registerOnce('support.streaming', async (input, context) => {
    if (context?.dataStream && typeof (context.dataStream as { write?: unknown }).write === 'function') (context.dataStream as { write: (value: unknown) => void }).write({ type: 'data-kind', data: 'n06-stream', transient: true });
    return input;
  });
  registerOnce('support.mesh', async (input) => ({ nucleus: 'N06', protocol: 'soul-mesh/1', accepted: true, payload: input }));
  return nucleus06Processor;
}

export function getN06DeclaredCapabilities(): readonly string[] { return [...NUCLEUS_06_CAPABILITIES]; }
export function getN06ExecutableCapabilities(): readonly string[] { activateNucleus06Runtime(); return [...nucleus06Processor.executableCapabilities()]; }
export function attachNucleus06Tools(_context: Nucleus05ToolContext) { activateNucleus06Runtime(); return nucleus06Processor; }
export function executeNucleus06Capability(input: unknown, context?: Nucleus06Context) { activateNucleus06Runtime(); return nucleus06Processor.execute({ capability: 'support.tool-execution', input }, context); }
export const attachNucleus05Tools = attachNucleus06Tools;
export const executeNucleus05Capability = executeNucleus06Capability;
export const getNucleus05Capabilities = getN06DeclaredCapabilities;
export const getNucleus05ExecutableCapabilities = getN06ExecutableCapabilities;

activateNucleus06Runtime();
