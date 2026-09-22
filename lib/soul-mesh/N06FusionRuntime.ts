import { generateText } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { systemPrompt } from '@/lib/ai/prompts';

export const N06_ID = 'N06' as const;
export const N06_FUSION_CAPABILITIES = [
  'mesh.handshake',
  'mesh.describe',
  'ai.reasoning',
  'conversation',
  'tools.describe',
  'context.orchestration',
] as const;

export type N06FusionCapability = typeof N06_FUSION_CAPABILITIES[number];

export interface N06FusionInput {
  prompt?: string;
  messages?: unknown[];
  model?: 'chat-model' | 'chat-model-reasoning';
  context?: Record<string, unknown>;
}

const TOOL_CATALOG = [
  { id: 'getWeather', execution: 'available-without-user-session' },
  { id: 'createDocument', execution: 'requires-user-session' },
  { id: 'updateDocument', execution: 'requires-user-session' },
  { id: 'requestSuggestions', execution: 'requires-user-session' },
] as const;

export function describeN06() {
  return {
    nucleus: N06_ID,
    role: 'independent-ai-nucleus',
    protocol: 'soul-mesh/1',
    capabilities: [...N06_FUSION_CAPABILITIES],
    tools: TOOL_CATALOG,
    modelBoundary: 'provider-neutral-mesh / provider-specific-ai-adapter',
  };
}

function promptFrom(input: N06FusionInput) {
  if (typeof input.prompt === 'string' && input.prompt.trim()) return input.prompt.trim();
  if (Array.isArray(input.messages)) return JSON.stringify(input.messages);
  return '';
}

export async function executeN06Fusion(capability: N06FusionCapability, input: N06FusionInput = {}) {
  switch (capability) {
    case 'mesh.handshake':
      return { ok: true, ...describeN06() };
    case 'mesh.describe':
      return describeN06();
    case 'tools.describe':
      return { nucleus: N06_ID, tools: TOOL_CATALOG };
    case 'context.orchestration':
      return { accepted: true, context: input.context ?? {}, nucleus: N06_ID };
    case 'conversation':
    case 'ai.reasoning': {
      const prompt = promptFrom(input);
      if (!prompt) throw new Error('AI_INPUT_REQUIRED');
      const model = input.model ?? (capability === 'ai.reasoning' ? 'chat-model-reasoning' : 'chat-model');
      const result = await generateText({
        model: myProvider.languageModel(model),
        system: systemPrompt({ selectedChatModel: model, requestHints: {} }),
        prompt,
      });
      return { nucleus: N06_ID, model, text: result.text, finishReason: result.finishReason };
    }
  }
}
