import "../../../lib/soul-core/N06NativeCapabilityRuntime";
import { n06Processor, type N06Context } from "../../../lib/soul-core/N06Processor";

export interface N06CognitionResult {
  text: string;
  metadata?: Record<string, unknown>;
}

function normalizeResult(result: unknown): N06CognitionResult {
  if (typeof result === "string") return { text: result };
  if (result && typeof result === "object") {
    const value = result as Record<string, unknown>;
    if (typeof value.text === "string") {
      return {
        text: value.text,
        metadata: value.metadata && typeof value.metadata === "object"
          ? value.metadata as Record<string, unknown>
          : undefined,
      };
    }
    if (typeof value.content === "string") {
      return {
        text: value.content,
        metadata: value.metadata && typeof value.metadata === "object"
          ? value.metadata as Record<string, unknown>
          : undefined,
      };
    }
  }
  return { text: JSON.stringify(result) };
}

export function isN06CognitionAvailable(): boolean {
  return n06Processor.supports("support.ai-pilot");
}

export async function executeN06Cognition(
  prompt: string,
  context: Readonly<Record<string, unknown>> = {},
): Promise<N06CognitionResult> {
  const normalized = prompt.trim();
  if (!normalized) throw new Error("N06_COGNITION_PROMPT_REQUIRED");
  if (!isN06CognitionAvailable()) throw new Error("N06_COGNITION_EXECUTOR_UNAVAILABLE");

  const result = await n06Processor.execute(
    {
      capability: "support.ai-pilot",
      input: {
        prompt: normalized,
        model: typeof context.model === "string" ? context.model : "chat-model",
        system: typeof context.system === "string" ? context.system : undefined,
      },
    },
    {
      metadata: context,
    } satisfies N06Context,
  );

  return normalizeResult(result);
}
