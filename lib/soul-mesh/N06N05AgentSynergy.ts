import { randomUUID } from 'node:crypto';
import { sendFromN06 } from './N06PeerAdapter';

export type N06AgentRole = 'planner' | 'validator' | 'orchestrator' | 'integrator';
export type N06AgentDescriptor = { id: string; nucleus: 'N06' | 'N05'; role: N06AgentRole; capabilities: string[]; consumers: string[] };
export type SynergyRequest = { task: string; input: unknown; correlationId?: string; traceId?: string; requireValidation?: boolean };

export const N06_N05_AGENTS: readonly N06AgentDescriptor[] = [
  { id: 'N06.planner', nucleus: 'N06', role: 'planner', capabilities: ['cognitive.plan'], consumers: ['N05'] },
  { id: 'N06.validator', nucleus: 'N06', role: 'validator', capabilities: ['cognitive.validate'], consumers: ['N05'] },
  { id: 'N05.reasoner', nucleus: 'N05', role: 'orchestrator', capabilities: ['ai.infer', 'inference.reason', 'inference.analyze'], consumers: ['N06'] },
];

export type SynergyStage = { agent: string; role: N06AgentRole; capability: string; output: unknown };

/**
 * Complementary N06/N05 workflow. N06 supplies planning/validation while N05
 * supplies inference. It uses the existing N06 Mesh adapter and does not add
 * a parallel transport.
 */
export class N06N05AgentSynergy {
  listAgents() { return N06_N05_AGENTS.map((agent) => ({ ...agent, capabilities: [...agent.capabilities], consumers: [...agent.consumers] })); }

  async planThenReason(request: SynergyRequest) {
    const correlationId = request.correlationId ?? randomUUID();
    const traceId = request.traceId ?? randomUUID();
    const plan = await sendFromN06('N05', 'ai.infer', { prompt: `Plan the following task for N06 execution: ${request.task}`, input: request.input, mode: 'plan-for-n06', correlationId, traceId });
    const stages: SynergyStage[] = [{ agent: 'N05.reasoner', role: 'orchestrator', capability: 'ai.infer', output: plan }];
    if (request.requireValidation) {
      const validation = await sendFromN06('N05', 'ai.infer', { prompt: 'Validate this N06 execution plan and identify missing assumptions.', plan, correlationId, traceId });
      stages.push({ agent: 'N05.reasoner', role: 'orchestrator', capability: 'ai.infer', output: validation });
    }
    return { source: 'N06', target: 'N05', correlationId, traceId, stages };
  }

  async validateN05Result(result: unknown, correlationId = randomUUID(), traceId = randomUUID()) {
    return sendFromN06('N05', 'ai.infer', { prompt: 'Critically validate this N06 result. Return defects, risks, and corrections.', result, correlationId, traceId });
  }
}

export function createN06N05AgentSynergy() { return new N06N05AgentSynergy(); }
