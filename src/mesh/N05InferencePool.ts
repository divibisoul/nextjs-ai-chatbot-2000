import os from 'node:os';
import { executeSoulInference, type SoulInferenceRequest } from '@/lib/soul-mesh/SoulMeshAI';

export type N05InferenceResult = Awaited<ReturnType<typeof executeSoulInference>>;
type Job = {
  priority: number;
  sequence: number;
  input: SoulInferenceRequest;
  resolve: (value: N05InferenceResult) => void;
  reject: (reason: unknown) => void;
};

/**
 * Bounded in-process inference scheduler.
 * Keeps the parallel execution contract without requiring an optional worker dependency.
 */
export class N05InferencePool {
  private readonly concurrency: number;
  private readonly queue: Job[] = [];
  private active = 0;
  private sequence = 0;

  constructor(concurrency = Math.max(1, os.cpus().length)) {
    const configured = Number(process.env.N05_MAX_CONCURRENCY ?? concurrency);
    this.concurrency = Number.isFinite(configured) && configured > 0
      ? Math.max(1, Math.floor(configured))
      : Math.max(1, os.cpus().length);
  }

  run(input: SoulInferenceRequest, priority = 50): Promise<N05InferenceResult> {
    return new Promise((resolve, reject) => {
      this.queue.push({ priority, sequence: this.sequence++, input, resolve, reject });
      this.queue.sort((a, b) => b.priority - a.priority || a.sequence - b.sequence);
      this.drain();
    });
  }

  private drain() {
    while (this.active < this.concurrency && this.queue.length > 0) {
      const job = this.queue.shift()!;
      this.active += 1;
      Promise.resolve(executeSoulInference(job.input))
        .then(job.resolve, job.reject)
        .finally(() => {
          this.active -= 1;
          this.drain();
        });
    }
  }

  stats() {
    return {
      active: this.active,
      queued: this.queue.length,
      concurrency: this.concurrency,
      workerPool: 'in-process-bounded',
    } as const;
  }

  async close() {
    // No external worker resources are owned by the in-process scheduler.
  }
}

export const n05InferencePool = new N05InferencePool();
