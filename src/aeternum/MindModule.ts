import { executeN06Cognition } from "./consciousness/N06CognitionAdapter";

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

  constructor(
    private readonly executor: MindExecutor = async (input, context) => {
      const result = await executeN06Cognition(input, context);
      return { content: result.text, metadata: result.metadata };
    },
  ) {}

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

    if (!input.trim()) throw new Error("M4_MIND_INPUT_REQUIRED");

    try {
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
    } catch (error) {
      if (error instanceof Error && error.message === "N06_COGNITION_EXECUTOR_UNAVAILABLE") {
        return {
          status: "adapter_unbound",
          module: "M4_MIND",
          inputAccepted: true,
          execution: "not_claimed",
          metadata: { reason: error.message },
        };
      }
      throw error;
    }
  }
}
