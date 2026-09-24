import React from "react";

export type RemediationStage = "detect" | "isolate" | "repair" | "verify";

export interface ASASFRemediationState {
  active: boolean;
  stage: RemediationStage | null;
  status: "idle" | "running" | "completed" | "failed";
  verification?: "not_observed" | "executor_confirmed" | "independently_verified";
}

export const ASASFPanelUI: React.FC<{ state: ASASFRemediationState }> = ({ state }) => {
  if (!state.active && state.status === "idle") return null;

  const completionLabel =
    state.status === "failed"
      ? "Remediação falhou"
      : state.status === "completed"
        ? state.verification === "independently_verified"
          ? "Remediação verificada"
          : state.verification === "executor_confirmed"
            ? "Remediação confirmada pelo executor"
            : "Remediação concluída sem verificação independente"
        : "Remediação em andamento";

  return (
    <section className="fixed inset-0 z-[60] pointer-events-none">
      <div className="absolute inset-0 bg-red-950/20 animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/95 backdrop-blur-xl rounded-2xl border border-red-500/50 p-8 max-w-md w-full">
        <div className="text-center">
          <div className="text-4xl mb-4">🛡️</div>
          <h2 className="text-lg font-bold text-red-400 mb-2">SARA / ASASF</h2>
          <p className="text-sm text-gray-400 mb-4">{completionLabel}</p>

          {["detect", "isolate", "repair", "verify"].map(stage => (
            <div
              key={stage}
              className={"flex items-center justify-between text-xs px-3 py-1.5 rounded " + (
                stage === state.stage ? "bg-red-500/20 text-red-300" : "bg-white/5 text-gray-400"
              )}
            >
              <span className="uppercase">{stage}</span>
              {stage === state.stage && <span>●</span>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
