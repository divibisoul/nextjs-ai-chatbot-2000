export type Listener<T = unknown> = (data: T) => void | Promise<void>;
export type Unsubscribe = () => void;

export interface NeuralModuleRegistration {
  id: string;
  type: "engine" | "ui";
  version: string;
  capabilities: readonly string[];
  dependencies: readonly string[];
}

export interface ConsciousnessEventBus {
  on<T>(event: string, listener: Listener<T>): Unsubscribe;
  once<T>(event: string, listener: Listener<T>): Unsubscribe;
  emit<T>(event: string, data: T): Promise<number>;
  getRegisteredEvents(): string[];
}

export interface ConsciousnessStateStore {
  set<T>(key: string, value: T): T;
  get<T>(key: string): T | undefined;
  has(key: string): boolean;
  snapshot(): Record<string, unknown>;
}

export interface ConsciousnessRegistry {
  register(
    id: string,
    component: unknown,
    registration: Omit<NeuralModuleRegistration, "id">,
  ): void;
  get<T>(id: string): T | undefined;
  list(): NeuralModuleRegistration[];
}

export interface ConsciousnessInfrastructure {
  eventBus: ConsciousnessEventBus;
  state: ConsciousnessStateStore;
  registry: ConsciousnessRegistry;
}

type PendingRegistration = {
  id: string;
  component: unknown;
  registration: Omit<NeuralModuleRegistration, "id">;
};

type PendingSubscription = {
  event: string;
  listener: Listener<unknown>;
  once: boolean;
  cancelled: boolean;
  unsubscribe?: Unsubscribe;
};

let boundInfrastructure: ConsciousnessInfrastructure | null = null;
const pendingRegistrations: PendingRegistration[] = [];
const pendingSubscriptions: PendingSubscription[] = [];

/**
 * Binds N06 to an externally owned runtime.
 *
 * No EventBus, state store or registry is created here. Before binding,
 * registration/subscription calls are retained only as explicit pending
 * contracts and are replayed into the supplied authoritative runtime.
 */
export function bindConsciousnessInfrastructure(
  infrastructure: ConsciousnessInfrastructure,
): void {
  if (boundInfrastructure) {
    if (boundInfrastructure !== infrastructure) {
      throw new Error("CONSCIOUSNESS_INFRASTRUCTURE_ALREADY_BOUND");
    }
    return;
  }

  boundInfrastructure = infrastructure;

  for (const pending of pendingRegistrations.splice(0)) {
    infrastructure.registry.register(
      pending.id,
      pending.component,
      pending.registration,
    );
  }

  for (const pending of pendingSubscriptions.splice(0)) {
    if (pending.cancelled) continue;
    pending.unsubscribe = pending.once
      ? infrastructure.eventBus.once(pending.event, pending.listener)
      : infrastructure.eventBus.on(pending.event, pending.listener);
  }
}

export function isConsciousnessInfrastructureBound(): boolean {
  return boundInfrastructure !== null;
}

export function getConsciousnessInfrastructure(): ConsciousnessInfrastructure | null {
  return boundInfrastructure;
}

function subscribe(
  event: string,
  listener: Listener<unknown>,
  once: boolean,
): Unsubscribe {
  if (boundInfrastructure) {
    return once
      ? boundInfrastructure.eventBus.once(event, listener)
      : boundInfrastructure.eventBus.on(event, listener);
  }

  const pending: PendingSubscription = {
    event,
    listener,
    once,
    cancelled: false,
  };
  pendingSubscriptions.push(pending);

  return () => {
    pending.cancelled = true;
    pending.unsubscribe?.();
    const index = pendingSubscriptions.indexOf(pending);
    if (index >= 0) pendingSubscriptions.splice(index, 1);
  };
}

export const nervoVago: ConsciousnessEventBus = {
  on<T>(event: string, listener: Listener<T>): Unsubscribe {
    return subscribe(event, listener as Listener<unknown>, false);
  },
  once<T>(event: string, listener: Listener<T>): Unsubscribe {
    return subscribe(event, listener as Listener<unknown>, true);
  },
  async emit<T>(event: string, data: T): Promise<number> {
    if (!boundInfrastructure) return 0;
    return boundInfrastructure.eventBus.emit(event, data);
  },
  getRegisteredEvents(): string[] {
    if (boundInfrastructure) return boundInfrastructure.eventBus.getRegisteredEvents();
    return [...new Set(pendingSubscriptions.map(item => item.event))].sort();
  },
};

export const hortaCore: ConsciousnessStateStore = {
  set<T>(key: string, value: T): T {
    return boundInfrastructure ? boundInfrastructure.state.set(key, value) : value;
  },
  get<T>(key: string): T | undefined {
    return boundInfrastructure?.state.get<T>(key);
  },
  has(key: string): boolean {
    return boundInfrastructure?.state.has(key) ?? false;
  },
  snapshot(): Record<string, unknown> {
    return boundInfrastructure?.state.snapshot() ?? {};
  },
};

export const wormhole: ConsciousnessRegistry = {
  register(
    id: string,
    component: unknown,
    registration: Omit<NeuralModuleRegistration, "id">,
  ): void {
    if (boundInfrastructure) {
      boundInfrastructure.registry.register(id, component, registration);
      return;
    }
    pendingRegistrations.push({ id, component, registration });
  },
  get<T>(id: string): T | undefined {
    return boundInfrastructure?.registry.get<T>(id);
  },
  list(): NeuralModuleRegistration[] {
    return boundInfrastructure?.registry.list() ?? [];
  },
};

export interface MetaThought {
  input: string;
  output: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
  latencyMs: number;
}

export type MetaThoughtExecutor = (
  query: string,
  context?: unknown,
) => Promise<{ output: string; metadata?: Record<string, unknown> }>;

export class MetaConsciousnessModule {
  readonly id = "meta-consciousness";
  private active = false;
  private thoughts: MetaThought[] = [];

  constructor(private readonly executor?: MetaThoughtExecutor) {
    wormhole.register(this.id, this, {
      type: "engine",
      version: "1.0.0",
      capabilities: ["meta-cognition", "reasoning", "reflection", "abstraction"],
      dependencies: ["aeternum.consciousness.eventBus", "aeternum.consciousness.hortaCore"],
    });
    nervoVago.on("meta.activate", () => this.activate());
    nervoVago.on("meta.deactivate", () => this.deactivate());
    nervoVago.on<{ query: string; context?: unknown }>(
      "meta.think",
      data => void this.think(data),
    );
    nervoVago.on<{ context?: unknown }>(
      "meta.reflect",
      data => void this.reflect(data),
    );
    this.active = hortaCore.get<boolean>(this.id + ".active") ?? false;
  }

  activate(): void {
    this.active = true;
    hortaCore.set(this.id + ".active", true);
    hortaCore.set(this.id + ".activatedAt", Date.now());
    void nervoVago.emit("module.activated", { module: this.id });
  }

  deactivate(): void {
    this.active = false;
    hortaCore.set(this.id + ".active", false);
    void nervoVago.emit("module.deactivated", { module: this.id });
  }

  async think(d: { query: string; context?: unknown }): Promise<void> {
    if (!this.active) {
      void nervoVago.emit("meta.error", {
        module: this.id,
        message: "Módulo inativo",
      });
      return;
    }

    const query = d.query.trim();
    if (!query) return;

    if (!this.executor) {
      void nervoVago.emit("meta.unbound", {
        module: this.id,
        reason: "executor cognitivo não conectado",
      });
      return;
    }

    const startedAt = Date.now();

    try {
      const result = await this.executor(query, d.context);
      const thought: MetaThought = {
        input: query,
        output: result.output,
        metadata: result.metadata,
        timestamp: Date.now(),
        latencyMs: Date.now() - startedAt,
      };
      this.thoughts = [...this.thoughts, thought].slice(-200);
      void nervoVago.emit("meta.result", thought);
    } catch (error) {
      void nervoVago.emit("meta.error", {
        module: this.id,
        message: "Falha no executor cognitivo",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async reflect(d: { context?: unknown }): Promise<void> {
    if (!this.active) return;
    void nervoVago.emit("meta.reflection", {
      module: this.id,
      thoughtCount: this.thoughts.length,
      activeMode: hortaCore.get("active.mode") ?? null,
      context: d.context,
      timestamp: Date.now(),
    });
  }

  getThoughtChain(): MetaThought[] {
    return [...this.thoughts];
  }
}

export const metaConsciousnessModule = new MetaConsciousnessModule();
