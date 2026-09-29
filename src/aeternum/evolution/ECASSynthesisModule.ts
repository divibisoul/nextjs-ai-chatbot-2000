export type ECASRequest = {
  sources: string[];
  target: string;
};

export type ECASResult = {
  status: "completed" | "handler_not_bound";
  target: string;
  artifact?: unknown;
  evidence?: unknown;
  execution: "real" | "not_claimed";
};

export type ECASEngine = (request: ECASRequest) => Promise<Omit<ECASResult, "status" | "execution">>;

export class ECASSynthesisModule {
  readonly id = "M7.ecas-synthesis";
  private active = false;
  private readonly history: ECASResult[] = [];

  constructor(private readonly executor?: ECASEngine) {}

  activate(): void {
    this.active = true;
  }

  deactivate(): void {
    this.active = false;
  }

  isActive(): boolean {
    return this.active;
  }

  async synthesize(request: ECASRequest): Promise<ECASResult> {
    if (!this.active || !this.executor) {
      return {
        status: "handler_not_bound",
        target: request.target,
        execution: "not_claimed",
      };
    }

    const produced = await this.executor({
      sources: [...request.sources],
      target: request.target,
    });

    const result: ECASResult = {
      status: "completed",
      target: request.target,
      artifact: produced.artifact,
      evidence: produced.evidence,
      execution: "real",
    };

    this.history.push(result);
    return result;
  }

  getHistory(): ECASResult[] {
    return [...this.history];
  }
}
