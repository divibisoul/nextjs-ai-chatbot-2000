import { generateText, stepCountIs, tool } from 'ai';
import { z } from 'zod';
import { myProvider } from '@/lib/ai/providers';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { createSoulMeshMessage } from './SoulMeshProtocol';
import { isPeer, sendToPeer } from './peerTransport';
import { N06_CAPABILITIES, type N06Capability } from './N06Capabilities';

const CHAT_MODEL = process.env.SOUL_MESH_AI_MODEL || 'chat-model';
const REASONING_MODEL = process.env.SOUL_MESH_REASONING_MODEL || 'chat-model-reasoning';
const MAX_PROMPT_CHARS = 100_000;

type RuntimeInput = {
  prompt?: string;
  system?: string;
  context?: unknown;
  model?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
};

type PeerRequest = {
  target?: string;
  capability?: string;
  payload?: unknown;
  correlationId?: string;
  timeoutMs?: number;
};

function asPrompt(input: unknown): string {
  if (typeof input === 'string') return input.slice(0, MAX_PROMPT_CHARS);
  return JSON.stringify(input ?? null).slice(0, MAX_PROMPT_CHARS);
}

function runtimeInput(input: unknown): RuntimeInput {
  if (typeof input === 'string') return { prompt: input };
  if (!input || typeof input !== 'object') return { prompt: asPrompt(input) };
  return input as RuntimeInput;
}

function buildPrompt(input: RuntimeInput): string {
  const prompt = input.prompt ?? asPrompt(input.context ?? input);
  if (!input.context) return prompt;
  return `${prompt}\n\n[SOUL CONTEXT]\n${asPrompt(input.context)}`;
}

function createNucleusCollaborationTool() {
  return tool({
    description: 'Ask another Soul AI nucleus to perform a capability and return its structured result.',
    inputSchema: z.object({
      target: z.enum(['N01', 'N02', 'N03', 'N04', 'N05']),
      capability: z.string().min(1).max(200),
      payload: z.unknown().optional(),
      correlationId: z.string().min(1).max(200).optional(),
    }),
    execute: async ({ target, capability, payload, correlationId }) => {
      const message = createSoulMeshMessage({
        correlationId: correlationId || crypto.randomUUID(),
        source: 'N06',
        target,
        kind: 'request',
        capability,
        payload,
      });
      return sendToPeer(target, message);
    },
  });
}

async function runModel(input: unknown, model: string, defaultSystem: string) {
  const request = runtimeInput(input);
  const result = await generateText({
    model: myProvider.languageModel(request.model || model),
    system: request.system || defaultSystem,
    prompt: buildPrompt(request),
    stopWhen: stepCountIs(5),
    tools: {
      getWeather,
      askNucleus: createNucleusCollaborationTool(),
    },
    experimental_activeTools: ['getWeather', 'askNucleus'],
  });

  return {
    nucleus: 'N06',
    text: result.text,
    model: request.model || model,
    finishReason: result.finishReason,
    usage: result.usage,
    steps: result.steps.length,
  };
}

class N06Runtime {
  readonly nucleus = 'N06' as const;
  readonly capabilities = N06_CAPABILITIES;

  async execute(capability: N06Capability, input: unknown): Promise<unknown> {
    switch (capability) {
      case 'mesh.ping':
        return { ok: true, nucleus: this.nucleus, timestamp: Date.now() };
      case 'mesh.describe':
      case 'capability-discovery':
        return {
          nucleus: this.nucleus,
          protocol: 'soul-mesh/1',
          capabilities: [...this.capabilities],
          runtime: {
            chatModel: CHAT_MODEL,
            reasoningModel: REASONING_MODEL,
            toolCalling: true,
            nucleusCollaboration: true,
            maxSteps: 5,
          },
          peers: ['N01', 'N02', 'N03', 'N04', 'N05'],
          timestamp: Date.now(),
        };
      case 'ai-pilot':
        return runModel(input, CHAT_MODEL, 'You are the N06 AI nucleus of Soul, a hybrid intelligence composed of six cooperating AI nuclei. Use askNucleus when another nucleus is better suited to the task. Treat remote results as evidence, preserve correlation context, and synthesize the final answer.');
      case 'cognitive.reason':
        return runModel(input, REASONING_MODEL, 'You are N06 reasoning within the Soul hybrid intelligence. Analyze rigorously, expose assumptions, compare alternatives, and delegate to another nucleus with askNucleus when its specialized capability is needed.');
      case 'context-orchestration': {
        const request = runtimeInput(input);
        return {
          nucleus: this.nucleus,
          context: request.context ?? input,
          metadata: request.metadata ?? {},
          correlationId: request.correlationId ?? null,
          timestamp: Date.now(),
        };
      }
      case 'tool-execution':
        return this.executeTool(input);
      case 'mesh-communication':
        return this.communicate(input);
      default:
        throw new Error(`UNSUPPORTED_N06_CAPABILITY:${String(capability)}`);
    }
  }

  private async executeTool(input: unknown) {
    const request = input as { tool?: string; input?: unknown } | null;
    if (!request || request.tool !== 'getWeather') throw new Error('TOOL_NOT_EXPOSED_TO_SOUL_MESH');
    const args = request.input as { latitude?: unknown; longitude?: unknown } | undefined;
    const latitude = Number(args?.latitude);
    const longitude = Number(args?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new Error('INVALID_WEATHER_COORDINATES');
    }
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`,
      { cache: 'no-store' },
    );
    if (!response.ok) throw new Error(`WEATHER_PROVIDER_HTTP_${response.status}`);
    return response.json();
  }

  private async communicate(input: unknown) {
    const request = input as PeerRequest | null;
    if (!request?.target || !isPeer(request.target)) throw new Error('INVALID_MESH_PEER');
    if (!request.capability) throw new Error('MISSING_REMOTE_CAPABILITY');
    const message = createSoulMeshMessage({
      correlationId: request.correlationId || crypto.randomUUID(),
      source: 'N06',
      target: request.target,
      kind: 'request',
      capability: request.capability,
      payload: request.payload,
    });
    return sendToPeer(request.target, message, { timeoutMs: request.timeoutMs });
  }
}

let runtime: N06Runtime | undefined;

export function ensureN06Runtime() {
  if (!runtime) runtime = new N06Runtime();
  return runtime;
}

export { N06Runtime };
