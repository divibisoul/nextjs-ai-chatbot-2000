export interface MindExecutorResult {
  content: string;
  metadata?: Record<string, unknown>;
}

export type MindExecutor = (
  input: string,
  context: Readonly<Record<string, unknown>>,
) => Promise<MindExecutorResult>;

export interface MindResult {
  status: "completed" | "adapter_unbound";
  module: "M4_MIND";
  inputAccepted: boolean;
  output?: string;
  metadata?: Record<string, unknown>;
  execution: "real" | "not_claimed";
}

export class MindModule {
  readonly id = "M4_MIND";
  private active = true;

  constructor(private readonly executor?: MindExecutor) {}

  activate(): void {
    this.active = true;
  }

  deactivate(): void {
    this.active = false;
  }

  isActive(): boolean {
    return this.active;
  }

  async process(
    input: string,
    context: Readonly<Record<string, unknown>> = {},
  ): Promise<MindResult> {
    if (!this.active) throw new Error("M4_MIND is inactive");

    if (!this.executor) {
      return {
        status: "adapter_unbound",
        module: "M4_MIND",
        inputAccepted: true,
        execution: "not_claimed",
      };
    }

    const result = await this.executor(
      input,
      Object.freeze({ ...context }),
    );

    return {
      status: "completed",
      module: "M4_MIND",
      inputAccepted: true,
      output: result.content,
      metadata: result.metadata,
      execution: "real",
    };
  }
}
