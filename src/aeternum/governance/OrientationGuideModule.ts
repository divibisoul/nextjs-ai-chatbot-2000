import { n06Processor } from "../../../lib/soul-core/N06Processor";

export type OrientationStep = {
  id: string;
  title: string;
  completed: boolean;
};

export type OrientationResult = {
  status: "completed" | "handler_unbound";
  steps: OrientationStep[];
  context?: unknown;
  execution: "real" | "not_claimed";
};

const DEFAULT_STEPS: readonly OrientationStep[] = [
  { id: "welcome", title: "Conheça o sistema", completed: false },
  { id: "nuclei", title: "Conheça os núcleos", completed: false },
  { id: "modules", title: "Explore os módulos", completed: false },
  { id: "workflow", title: "Entenda o fluxo", completed: false },
];

export class OrientationGuideModule {
  readonly id = "M8.orientation-guide";
  private active = false;
  private steps = DEFAULT_STEPS.map((step) => ({ ...step }));

  activate(): void {
    this.active = true;
  }

  deactivate(): void {
    this.active = false;
  }

  completeStep(stepId: string): void {
    const step = this.steps.find((item) => item.id === stepId);
    if (step) step.completed = true;
  }

  listSteps(): OrientationStep[] {
    return this.steps.map((step) => ({ ...step }));
  }

  async getGuide(contextInput: unknown = {}): Promise<OrientationResult> {
    if (!this.active) {
      return {
        status: "handler_unbound",
        steps: this.listSteps(),
        execution: "not_claimed",
      };
    }

    if (!n06Processor.supports("support.context")) {
      return {
        status: "handler_unbound",
        steps: this.listSteps(),
        execution: "not_claimed",
      };
    }

    const context = await n06Processor.execute(
      {
        capability: "support.context",
        input: contextInput,
        requestId: `orientation-${Date.now()}`,
      },
      { metadata: { module: this.id } },
    );

    return {
      status: "completed",
      steps: this.listSteps(),
      context,
      execution: "real",
    };
  }
}

export const orientationGuideModule = new OrientationGuideModule();
