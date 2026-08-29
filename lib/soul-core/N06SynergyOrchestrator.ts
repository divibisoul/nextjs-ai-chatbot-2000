import { randomUUID } from 'node:crypto';
import { sendFromN06, type N06Peer } from '../soul-mesh/N06PeerAdapter';

export type N06SynergyStep = { nucleus: N06Peer; capability: string; payload: unknown };
export type N06SynergyResult = { correlationId: string; steps: Array<{ nucleus: N06Peer; capability: string; result: unknown }> };

/** Cooperative execution: N06 can compose work across specialized peer IAs instead of duplicating their capabilities. */
export async function executeN06Synergy(steps: N06SynergyStep[], correlationId = randomUUID()): Promise<N06SynergyResult> {
  const results: N06SynergyResult['steps'] = [];
  let previous: unknown = undefined;
  for (const step of steps) {
    const payload = previous === undefined ? step.payload : { input: step.payload, previous, correlationId };
    const result = await sendFromN06(step.nucleus, step.capability, payload);
    results.push({ nucleus: step.nucleus, capability: step.capability, result });
    previous = result;
  }
  return { correlationId, steps: results };
}

export async function n06CognitiveToolChain(prompt: string) {
  return executeN06Synergy([
    { nucleus: 'N02', capability: 'inference.reason', payload: { prompt } },
    { nucleus: 'N04', capability: 'tool.execute', payload: { instruction: 'Use the best available tool for the previous result.' } },
    { nucleus: 'N02', capability: 'conversation.summarize', payload: { prompt: 'Synthesize the tool result into a useful answer.' } },
  ]);
}

export async function n06DocumentReasoningChain(prompt: string) {
  return executeN06Synergy([
    { nucleus: 'N02', capability: 'inference.reason', payload: { prompt } },
    { nucleus: 'N04', capability: 'document.create', payload: { instruction: 'Create an artifact from the reasoning result.' } },
    { nucleus: 'N03', capability: 'audio.summarize', payload: { input: 'Summarize or narrate the resulting artifact.' } },
  ]);
}
