import React, { useEffect, useState } from "react";
import {
  metaConsciousnessModule,
  nervoVago,
  type MetaThought,
} from "./MetaConsciousnessModule";

export const MetaConsciousnessUI: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [thoughts, setThoughts] = useState<MetaThought[]>([]);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    const activated = nervoVago.on<{ module: string }>(
      "module.activated",
      event => {
        if (event.module === metaConsciousnessModule.id) {
          setVisible(true);
        }
      },
    );

    const deactivated = nervoVago.on<{ module: string }>(
      "module.deactivated",
      event => {
        if (event.module === metaConsciousnessModule.id) {
          setVisible(false);
        }
      },
    );

    const result = nervoVago.on<MetaThought>("meta.result", thought => {
      setThoughts(previous => [...previous, thought].slice(-100));
      setStatus("completed");
    });

    const unbound = nervoVago.on("meta.unbound", () => setStatus("executor-unbound"));
    const error = nervoVago.on("meta.error", () => setStatus("error"));
    const processing = nervoVago.on("meta.think", () => setStatus("processing"));

    return () => {
      activated();
      deactivated();
      result();
      unbound();
      error();
      processing();
    };
  }, []);

  if (!visible) return null;

  return (
    <aside className="fixed right-0 top-0 z-40 flex h-full w-96 flex-col border-l border-cyan-500/30 bg-black/95">
      <header className="flex justify-between border-b border-white/10 p-4">
        <div>
          <div className="text-sm font-bold text-cyan-400">META-CONSCIÊNCIA</div>
          <div className="text-[11px] text-gray-500">{status}</div>
        </div>
        <button
          type="button"
          onClick={() => void nervoVago.emit("meta.deactivate", undefined)}
        >
          Desativar
        </button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {thoughts.map((thought, index) => (
          <article
            key={thought.id}
            className="rounded border border-cyan-500/10 p-3"
          >
            <div className="text-[11px] text-cyan-400">
              RESULTADO #{index + 1} · {thought.latencyMs}ms
            </div>
            <div className="whitespace-pre-wrap text-sm">{thought.output}</div>
          </article>
        ))}
      </div>

      <form
        className="border-t border-white/10 p-4"
        onSubmit={event => {
          event.preventDefault();
          const query = String(
            new FormData(event.currentTarget).get("query") ?? "",
          );
          if (query.trim()) {
            void nervoVago.emit("meta.think", { query });
          }
          event.currentTarget.reset();
        }}
      >
        <input
          name="query"
          className="w-full rounded border border-white/10 bg-black/50 p-2 text-sm"
          placeholder="Enviar para o executor cognitivo..."
        />
      </form>
    </aside>
  );
};
