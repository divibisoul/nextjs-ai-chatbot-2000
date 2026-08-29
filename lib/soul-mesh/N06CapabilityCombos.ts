import { createN06N01Bridge, type N06N01Bridge } from './N06N01Bridge';

export type ComboStep = { nucleus: 'N01'|'N02'|'N03'|'N04'|'N05'|'N06'; capability: string; payload: unknown };
export type ComboResult = { nucleus: string; capability: string; result: unknown; latencyMs: number };

export class N06CapabilityCombos {
  constructor(private readonly bridge: N06N01Bridge = createN06N01Bridge()) {}

  async execute(steps: readonly ComboStep[]) {
    const results: ComboResult[] = [];
    for (const step of steps) {
      const started = Date.now();
      if (step.nucleus === 'N01') {
        const result = await this.bridge.delegate(step.capability, step.payload);
        results.push({ nucleus: step.nucleus, capability: step.capability, result: result.payload, latencyMs: Date.now() - started });
        continue;
      }
      throw new Error(`N06_COMBO_PEER_BRIDGE_NOT_CONFIGURED:${step.nucleus}`);
    }
    return { source: 'N06', results, completed: results.length === steps.length };
  }

  async n01Plan(input: unknown) {
    return this.execute([{ nucleus: 'N01', capability: 'cognitive.plan', payload: input }]);
  }

  async n01Validate(input: unknown) {
    return this.execute([{ nucleus: 'N01', capability: 'cognitive.validate', payload: input }]);
  }
}

export function createN06CapabilityCombos(bridge?: N06N01Bridge) { return new N06CapabilityCombos(bridge); }
