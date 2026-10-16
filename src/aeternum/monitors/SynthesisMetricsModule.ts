import { hortaCore, nervoVago } from "../consciousness/MetaConsciousnessModule";

export type SynthesisMetricObservation = {
  coherence?: number;
  confidence?: number;
  integrationTimeMs?: number;
  source: string;
  evidence?: unknown;
  timestamp?: number;
};

export type SynthesisMetricRecord = SynthesisMetricObservation & {
  timestamp: number;
  observedFields: string[];
};

export class SynthesisMetricsModule {
  readonly id = "L5.SynthesisMetricsModule";
  private active = false;
  private readonly metrics: SynthesisMetricRecord[] = [];

  constructor() {
    nervoVago.on("synthesis.metrics.activate", () => this.activate());
    nervoVago.on("synthesis.metrics.deactivate", () => this.deactivate());
    nervoVago.on("synthesis.metrics.record", (data: SynthesisMetricObservation) => {
      this.record(data);
    });
    nervoVago.on("synthesis.metrics.request", () => {
      nervoVago.emit("synthesis.metrics.updated", this.getMetrics());
    });
  }

  activate(): void {
    this.active = true;
    hortaCore.set(`${this.id}.active`, true);
    nervoVago.emit("module.activated", { module: this.id });
  }

  deactivate(): void {
    this.active = false;
    hortaCore.set(`${this.id}.active`, false);
    nervoVago.emit("module.deactivated", { module: this.id });
  }

  record(data: SynthesisMetricObservation): SynthesisMetricRecord | null {
    if (!this.active) return null;
    if (!data.source.trim()) {
      nervoVago.emit("synthesis.metrics.invalid", {
        module: this.id,
        reason: "SOURCE_REQUIRED",
      });
      return null;
    }

    if (
      data.coherence !== undefined &&
      (!Number.isFinite(data.coherence) || data.coherence < 0 || data.coherence > 1)
    ) {
      return this.invalid("COHERENCE_OUT_OF_RANGE");
    }

    if (
      data.confidence !== undefined &&
      (!Number.isFinite(data.confidence) || data.confidence < 0 || data.confidence > 1)
    ) {
      return this.invalid("CONFIDENCE_OUT_OF_RANGE");
    }

    if (
      data.integrationTimeMs !== undefined &&
      (!Number.isFinite(data.integrationTimeMs) || data.integrationTimeMs < 0)
    ) {
      return this.invalid("INTEGRATION_TIME_INVALID");
    }

    const observedFields = (["coherence", "confidence", "integrationTimeMs"] as const)
      .filter((field) => data[field] !== undefined);

    if (observedFields.length === 0) {
      return this.invalid("NO_OBSERVED_METRICS");
    }

    const record: SynthesisMetricRecord = {
      ...data,
      timestamp: data.timestamp ?? Date.now(),
      observedFields: [...observedFields],
    };

    this.metrics.push(record);
    if (this.metrics.length > 100) this.metrics.shift();

    hortaCore.set("synthesis.metrics", this.getMetrics());
    nervoVago.emit("synthesis.metrics.updated", record);
    return { ...record };
  }

  getMetrics(): SynthesisMetricRecord[] {
    return this.metrics.map((metric) => ({ ...metric }));
  }

  getAverage(): Partial<Record<"coherence" | "confidence" | "integrationTimeMs", number>> | null {
    if (this.metrics.length === 0) return null;

    const average: Partial<Record<"coherence" | "confidence" | "integrationTimeMs", number>> = {};
    for (const field of ["coherence", "confidence", "integrationTimeMs"] as const) {
      const values = this.metrics
        .map((metric) => metric[field])
        .filter((value): value is number => value !== undefined && Number.isFinite(value));
      if (values.length > 0) {
        average[field] = values.reduce((sum, value) => sum + value, 0) / values.length;
      }
    }
    return Object.keys(average).length > 0 ? average : null;
  }

  private invalid(reason: string): null {
    nervoVago.emit("synthesis.metrics.invalid", { module: this.id, reason });
    return null;
  }
}

export const synthesisMetricsModule = new SynthesisMetricsModule();
