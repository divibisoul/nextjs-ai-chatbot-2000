import { randomUUID } from 'node:crypto';
import { N06N05AgentSynergy } from './N06N05AgentSynergy';

export type PairStageInput = {
  task: string;
  input: unknown;
  requireValidation?: boolean;
  correlationId?: string;
  traceId?: string;
};

export type PairStageResult = {
  stage: 'N06-N05';
  source: 'N06';
  target: 'N05';
  correlationId: string;
  traceId: string;
  completed: boolean;
  stages: Array<{ agent: string; role: string; capability: string; output: unknown }>;
};

/**
 * Reverse half of the ordered N05/N06 pair. N06 can request N05 reasoning,
 * then use the returned inference as planning/validation input. The contract
 * is intentionally additive and preserves the existing N06 Mesh adapter.
 */
export class N06N05PairStage {
  constructor(private readonly synergy = new N06N05AgentSynergy()) {}

  async execute(input: PairStageInput): Promise<PairStageResult> {
    const correlationId = input.correlationId ?? randomUUID();
    const traceId = input.traceId ?? randomUUID();
    const result = await this.synergy.planWithReasoning({
      task: input.task,
      input: input.input,
      requireValidation: input.requireValidation ?? true,
      correlationId,
      traceId,
    });
    return {
      stage: 'N06-N05',
      source: 'N06',
      target: 'N05',
      correlationId,
      traceId,
      completed: result.stages.length >= (input.requireValidation === false ? 2 : 3),
      stages: result.stages,
    };
  }
}

export function createN06N05PairStage() { return new N06N05PairStage(); }
