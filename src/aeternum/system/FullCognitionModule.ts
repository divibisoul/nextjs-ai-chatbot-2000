/**
 * L6 — FULL COGNITION MODULE
 * Host: N06 | Affinity: M4_MIND
 *
 * Compatibility surface for the historical "full cognition" mode.
 * It does not claim to activate every module or increase compute power.
 * Its truth source is the canonical N06Processor executable-capability set.
 */
import { n06Processor } from "../../../lib/soul-core/N06Processor";

export interface FullCognitionState {
  enabled: boolean;
  executableCapabilities: readonly string[];
  timestamp: number;
}

export class FullCognitionModule {
  readonly id = "full-cognition" as const;
  private enabled = false;

  enable(): FullCognitionState {
    this.enabled = true;
    return this.getState();
  }

  disable(): FullCognitionState {
    this.enabled = false;
    return this.getState();
  }

  getState(): FullCognitionState {
    return {
      enabled: this.enabled,
      executableCapabilities: n06Processor.executableCapabilities(),
      timestamp: Date.now(),
    };
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export const fullCognitionModule = new FullCognitionModule();
