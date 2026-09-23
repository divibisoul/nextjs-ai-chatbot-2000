export type ASCDiscoveryRequest = {
  scope: string;
  constraints?: string[];
  context?: Record<string, unknown>;
};

export type ASCDiscoveryResult = {
  status: "completed" | "handler_not_bound";
  scope: string;
  discoveries?: unknown[];
  evidence?: unknown;
  execution: "real" | "not_claimed";
};

export type ASCExecutor = (
  request: ASCDiscoveryRequest,
) => Promise<Omit<ASCDiscoveryResult, "status" | "execution">>;

export class ASCModule {
  readonly id = "M7.asc";
  private active = false;
  private readonly discoveries: ASCDiscoveryResult[] = [];

  constructor(private readonly executor?: ASCExecutor) {}

  activate(): void {
    this.active = true;
  }

  deactivate(): void {
    this.active = false;
  }

  async discover(request: ASCDiscoveryRequest): Promise<ASCDiscoveryResult> {
    if (!this.active || !this.executor) {
      return {
        status: "handler_not_bound",
        scope: request.scope,
        execution: "not_claimed",
      };
    }

    const produced = await this.executor({
      scope: request.scope,
      constraints: request.constraints ? [...request.constraints] : undefined,
      context: request.context ? { ...request.context } : undefined,
    });

    const result: ASCDiscoveryResult = {
      status: "completed",
      scope: request.scope,
      discoveries: produced.discoveries ?? [],
      evidence: produced.evidence,
      execution: "real",
    };

    this.discoveries.push(result);
    return result;
  }

  getDiscoveries(): ASCDiscoveryResult[] {
    return [...this.discoveries];
  }
}
