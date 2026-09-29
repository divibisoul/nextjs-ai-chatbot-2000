/**
 * L6 — QUANTUM CORE MODULE
 * Host: N06 | Affinity: M4_MIND
 *
 * Compatibility adapter for the historical "quantum core" concept.
 * There is no quantum hardware here and no simulated qubit count.
 * It provides explicit parallel branch execution through the real N06 runtime.
 */
import { n06Processor } from "../../../lib/soul-core/N06Processor";
import type { N06Context } from "../../../lib/soul-core/N06Processor";

export interface QuantumBranchResult {
  branch: number;
  ok: boolean;
  value?: unknown;
  error?: string;
  startedAt: number;
  completedAt: number;
}

export class QuantumCoreModule {
  readonly id = "quantum-core" as const;
  private active = false;

  activate(): void {
    this.active = true;
  }

  deactivate(): void {
    this.active = false;
  }

  isActive(): boolean {
    return this.active;
  }

  async process(data: {
    capability: string;
    inputs: readonly unknown[];
    context?: N06Context;
  }): Promise<QuantumBranchResult[]> {
    if (!this.active) {
      throw new Error("QUANTUM_CORE_INACTIVE");
    }
    if (!data.capability.trim()) throw new Error("N06_CAPABILITY_REQUIRED");
    if (data.inputs.length === 0) return [];

    const branches = data.inputs.map(async (input, branch) => {
      const startedAt = Date.now();
      try {
        const value = await n06Processor.execute(
          { capability: data.capability as never, input, requestId: `quantum-${Date.now()}-${branch}` },
          data.context,
        );
        return {
          branch,
          ok: true,
          value,
          startedAt,
          completedAt: Date.now(),
        } satisfies QuantumBranchResult;
      } catch (error) {
        return {
          branch,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
          startedAt,
          completedAt: Date.now(),
        } satisfies QuantumBranchResult;
      }
    });

    return Promise.all(branches);
  }
}

export const quantumCoreModule = new QuantumCoreModule();
