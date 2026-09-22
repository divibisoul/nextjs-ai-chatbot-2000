import { generateText } from 'ai';
import { myProvider } from '@/lib/ai/providers';

export interface SoulInferenceRequest {
  prompt: string;
  system?: string;
  model?: 'chat-model' | 'chat-model-reasoning';
}

export interface SoulInferenceResult {
  model: SoulInferenceRequest['model'];
  text: string;
  usage: unknown;
}

export async function executeSoulInference(
  request: SoulInferenceRequest,
): Promise<SoulInferenceResult> {
  const prompt = request.prompt.trim();
  if (!prompt) throw new Error('SOUL_INFERENCE_PROMPT_REQUIRED');
  const model = request.model ?? 'chat-model';
  const result = await generateText({
    model: myProvider.languageModel(model),
    system: request.system,
    prompt,
  });
  return { model, text: result.text, usage: result.usage };
}
