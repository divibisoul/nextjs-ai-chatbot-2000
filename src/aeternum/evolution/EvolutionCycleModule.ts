export type EvolutionCycleRequest = {
  generation: number;
  target: string;
  context?: Record<string, unknown>;
};

export type EvolutionCycleResult = {
  status: "completed" | "handler_not_bound";
  generation: number;
  target: string;
  evaluation?: unknown;
  mutation?: unknown;
  tests?: unknown;
  execution: "real" | "not_claimed";
};

export interface EvolutionCycleExecutor {
  evaluate(request: EvolutionCycleRequest): Promise<unknown>;
  mutate(request: EvolutionCycleRequest, evaluation: unknown): Promise<unknown>;
  test(request: EvolutionCycleRequest, mutation: unknown): Promise<unknown>;
}

export class EvolutionCycleModule {
  readonly id = "M7.evolution-cycle";
  private active = false;
  private generation = 0;
  private readonly history: EvolutionCycleResult[] = [];

  constructor(private readonly executor?: EvolutionCycleExecutor) {}

  activate(): void {
    this.active = true;
  }

  deactivate(): void {
    this.active = false;
  }

  async runCycle(request: Omit<EvolutionCycleRequest, "generation">): Promise<EvolutionCycleResult> {
    if (!this.active || !this.executor) {
      return {
        status: "handler_not_bound",
        generation: this.generation,
        target: request.target,
        execution: "not_claimed",
      };
    }

    const generation = request.context?.generation
      ? Number(request.context.generation)
      : this.generation + 1;
    this.generation = Number.isFinite(generation) ? generation : this.generation + 1;

    const cycleRequest: EvolutionCycleRequest = {
      ...request,
      generation: this.generation,
    };

    const evaluation = await this.executor.evaluate(cycleRequest);
    const mutation = await this.executor.mutate(cycleRequest, evaluation);
    const tests = await this.executor.test(cycleRequest, mutation);

    const result: EvolutionCycleResult = {
      status: "completed",
      generation: this.generation,
      target: request.target,
      evaluation,
      mutation,
      tests,
      execution: "real",
    };

    this.history.push(result);
    return result;
  }

  getHistory(): EvolutionCycleResult[] {
    return [...this.history];
  }
}
