import { sendFromN06, type N06Peer } from './N06PeerAdapter';

export type ComboStep = { nucleus: N06Peer; capability: string; payload: unknown };
export type ComboResult = { nucleus: string; capability: string; result: unknown; latencyMs: number };

/**
 * Composes real Soul Mesh capabilities across independent nuclei.
 * A combo is deliberately transport-agnostic: each step is executed through
 * the canonical N06 outbound adapter, so no second mesh is introduced.
 */
export class N06CapabilityCombos {
  async execute(steps: readonly ComboStep[]) {
    const results: ComboResult[] = [];
    for (const step of steps) {
      const started = Date.now();
      const result = await sendFromN06(step.nucleus, step.capability, step.payload);
      results.push({ nucleus: step.nucleus, capability: step.capability, result, latencyMs: Date.now() - started });
    }
    return { source: 'N06', results, completed: results.length === steps.length };
  }

  async n01Plan(input: unknown) {
    return this.execute([{ nucleus: 'N01', capability: 'cognitive.plan', payload: input }]);
  }

  async n01Validate(input: unknown) {
    return this.execute([{ nucleus: 'N01', capability: 'cognitive.validate', payload: input }]);
  }

  async n05Reason(input: unknown) {
    return this.execute([{ nucleus: 'N05', capability: 'ai.infer', payload: input }]);
  }

  async n05ReasonThenPilot(input: unknown) {
    const reasoning = await this.n05Reason(input);
    return this.execute([{ nucleus: 'N05', capability: 'ai.infer', payload: { prompt: 'Refine the following N06 pilot result and return an actionable plan.', context: reasoning } }]);
  }

  async n05ThenN01(input: unknown) {
    const n05 = await this.execute([{ nucleus: 'N05', capability: 'ai.infer', payload: input }]);
    const n01 = await this.execute([{ nucleus: 'N01', capability: 'cognitive.validate', payload: { source: 'N05', result: n05 } }]);
    return { n05, n01 };
  }
}

export function createN06CapabilityCombos() { return new N06CapabilityCombos(); }
