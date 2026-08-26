import { generateText } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { nucleus05Processor } from '@/lib/soul-core/Nucleus05Processor';
import type { Nucleus05Capability } from '@/lib/soul-core/Nucleus05Capabilities';

const MODEL = process.env.SOUL_MESH_AI_MODEL || 'chat-model';

function asPrompt(input: unknown): string {
  if (typeof input === 'string') return input;
  return JSON.stringify(input ?? null);
}

let initialized = false;

/** Connects N06's existing AI runtime to the Soul Mesh capability boundary. */
export function ensureN06Runtime() {
  if (initialized) return nucleus05Processor;

  nucleus05Processor
    .registerHandler('ai-pilot', async input => {
      const result = await generateText({
        model: myProvider.languageModel(MODEL),
        prompt: asPrompt(input),
      });
      return { text: result.text, model: MODEL };
    })
    .registerHandler('context-orchestration', async input => ({
      nucleus: 'N06',
      context: input,
      timestamp: Date.now(),
    }))
    .registerHandler('mesh-communication', async input => ({
      nucleus: 'N06',
      accepted: true,
      payload: input,
      timestamp: Date.now(),
    }))
    .registerHandler('streaming', async input => ({
      nucleus: 'N06',
      accepted: true,
      payload: input,
      mode: 'request-response',
      timestamp: Date.now(),
    }));

  initialized = true;
  return nucleus05Processor;
}

export const N06_CAPABILITIES: readonly Nucleus05Capability[] = [
  'ai-pilot',
  'tool-execution',
  'artifact-processing',
  'document-processing',
  'context-orchestration',
  'streaming',
  'mesh-communication',
];
