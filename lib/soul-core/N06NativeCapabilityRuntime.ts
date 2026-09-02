import { generateText } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { chatModels } from '@/lib/ai/models';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { createN06Tools, type N06ToolContext } from './N06ToolRegistry';
import { n06CapabilityEngine, type N06EngineContext } from './N06CapabilityEngine';

type LocalToolExecutionOptions = { toolCallId: string; messages: unknown[] };
type ExecutableTool = { execute?: (input: unknown, options: LocalToolExecutionOptions) => unknown | Promise<unknown> };

function requireToolContext(context?: N06EngineContext): N06ToolContext {
  if (!context?.session || !context?.dataStream) throw new Error('N06_TOOL_CONTEXT_REQUIRED');
  return { session: context.session as N06ToolContext['session'], dataStream: context.dataStream as N06ToolContext['dataStream'] };
}
function objectInput(input: unknown): Record<string, unknown> { if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('N06_INPUT_MUST_BE_OBJECT'); return input as Record<string, unknown>; }
function toolOptions(): LocalToolExecutionOptions { return { toolCallId: crypto.randomUUID(), messages: [] }; }
async function executeTool(tool: ExecutableTool, args: unknown) { if (typeof tool.execute !== 'function') throw new Error('TOOL_NOT_EXECUTABLE'); return tool.execute(args, toolOptions()); }

async function executeNativeTool(input: unknown, context?: N06EngineContext) {
  const value = objectInput(input); const tool = String(value.tool ?? ''); const args = value.arguments ?? value.args ?? {};
  if (tool === 'getWeather') return executeTool(getWeather as ExecutableTool, args);
  const tools = createN06Tools(requireToolContext(context));
  if (tool !== 'createDocument' && tool !== 'updateDocument' && tool !== 'requestSuggestions') throw new Error(`UNKNOWN_TOOL:${tool}`);
  return executeTool(tools[tool], args);
}
async function executePilot(input: unknown, context?: N06EngineContext) {
  const value = objectInput(input); const prompt = typeof value.prompt === 'string' ? value.prompt.trim() : ''; if (!prompt) throw new Error('N06_AI_PILOT_PROMPT_REQUIRED');
  const requestedModel = typeof value.model === 'string' ? value.model : ''; const modelId = chatModels.some(model => model.id === requestedModel) ? requestedModel : 'chat-model';
  const result = await generateText({ model: myProvider.languageModel(modelId), system: typeof value.system === 'string' ? value.system : undefined, prompt });
  return { nucleus: 'N06', model: modelId, text: result.text, usage: result.usage, metadata: context?.metadata ?? {} };
}
export function activateN06NativeCapabilities() {
  if (n06CapabilityEngine.listHandlers().length > 0) return n06CapabilityEngine;
  n06CapabilityEngine
    .registerHandler('support.ai-pilot', executePilot)
    .registerHandler('support.tool-execution', executeNativeTool)
    .registerHandler('support.artifacts', async (input, context) => { const value = objectInput(input); const toolContext = requireToolContext(context); if (value.action === 'update') return executeTool(updateDocument(toolContext) as ExecutableTool, { id: String(value.id ?? ''), description: String(value.description ?? '') }); return executeTool(createDocument(toolContext) as ExecutableTool, { title: String(value.title ?? 'Untitled'), kind: value.kind }); })
    .registerHandler('support.documents', async (input, context) => { const value = objectInput(input); const toolContext = requireToolContext(context); if (value.action === 'update') return executeTool(updateDocument(toolContext) as ExecutableTool, { id: String(value.id ?? ''), description: String(value.description ?? '') }); return executeTool(createDocument(toolContext) as ExecutableTool, { title: String(value.title ?? 'Untitled'), kind: value.kind }); })
    .registerHandler('support.context', async (input, context) => ({ input, metadata: context?.metadata ?? {}, nucleus: 'N06' }))
    .registerHandler('support.streaming', async (input, context) => { if (context?.dataStream && typeof (context.dataStream as { write?: unknown }).write === 'function') (context.dataStream as { write: (value: unknown) => void }).write({ type: 'data-kind', data: 'n06-stream', transient: true }); return input; })
    .registerHandler('support.mesh', async (input) => ({ accepted: true, protocol: 'soul-mesh/1', nucleus: 'N06', payload: input }));
  n06CapabilityEngine.registerPilot({ id: 'n06-native-ai-pilot', execute: executePilot });
  return n06CapabilityEngine;
}
activateN06NativeCapabilities();
