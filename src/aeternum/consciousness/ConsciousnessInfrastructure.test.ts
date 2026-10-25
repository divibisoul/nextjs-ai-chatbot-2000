import assert from "node:assert/strict";
import test from "node:test";
import {
  bindConsciousnessInfrastructure,
  getConsciousnessInfrastructure,
  isConsciousnessInfrastructureBound,
  nervoVago,
  wormhole,
  type ConsciousnessEventBus,
  type ConsciousnessInfrastructure,
  type ConsciousnessRegistry,
  type ConsciousnessStateStore,
  type Listener,
} from "./index";

test("N06 consciousness does not create a private infrastructure authority", async () => {
  assert.equal(isConsciousnessInfrastructureBound(), false);

  const eventListeners = new Map<string, Set<Listener<unknown>>>();
  const stateValues = new Map<string, unknown>();
  const registrations = new Map<string, ReturnType<ConsciousnessRegistry["list"]>[number]>();

  const eventBus: ConsciousnessEventBus = {
    on<T>(event: string, listener: Listener<T>) {
      const listeners = eventListeners.get(event) ?? new Set<Listener<unknown>>();
      listeners.add(listener as Listener<unknown>);
      eventListeners.set(event, listeners);
      return () => listeners.delete(listener as Listener<unknown>);
    },
    once<T>(event: string, listener: Listener<T>) {
      let unsubscribe = () => undefined;
      unsubscribe = this.on(event, async data => {
        unsubscribe();
        await listener(data);
      });
      return unsubscribe;
    },
    async emit<T>(event: string, data: T) {
      const listeners = [...(eventListeners.get(event) ?? [])];
      await Promise.all(listeners.map(listener => listener(data)));
      return listeners.length;
    },
    getRegisteredEvents() {
      return [...eventListeners.keys()].sort();
    },
  };

  const state: ConsciousnessStateStore = {
    set<T>(key: string, value: T) {
      stateValues.set(key, value);
      return value;
    },
    get<T>(key: string) {
      return stateValues.get(key) as T | undefined;
    },
    has(key: string) {
      return stateValues.has(key);
    },
    snapshot() {
      return Object.fromEntries(stateValues.entries());
    },
  };

  const registry: ConsciousnessRegistry = {
    register(id, _component, metadata) {
      if (registrations.has(id)) {
        throw new Error("DUPLICATE:" + id);
      }
      registrations.set(id, { id, ...metadata });
    },
    get() {
      return undefined;
    },
    list() {
      return [...registrations.values()].sort((a, b) => a.id.localeCompare(b.id));
    },
  };

  const infrastructure: ConsciousnessInfrastructure = { eventBus, state, registry };
  bindConsciousnessInfrastructure(infrastructure);

  assert.equal(getConsciousnessInfrastructure(), infrastructure);
  assert.equal(registrations.size, 8);

  const seen: unknown[] = [];
  const unsubscribe = nervoVago.on("test.event", value => {
    seen.push(value);
  });
  await nervoVago.emit("test.event", { ok: true });
  unsubscribe();

  assert.deepEqual(seen, [{ ok: true }]);
  assert.ok(registrations.has("meta-consciousness"));
  assert.ok(registrations.has("cognitive-nucleus"));
  assert.ok(wormhole.list().some(item => item.id === "codex"));
});
