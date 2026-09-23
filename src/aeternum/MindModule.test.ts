import assert from "node:assert/strict";
import test from "node:test";
import { MindModule } from "./MindModule";

test("M4 does not fabricate cognition when no executor is bound", async () => {
  const module = new MindModule();
  const result = await module.process("teste");
  assert.equal(result.status, "adapter_unbound");
  assert.equal(result.execution, "not_claimed");
  assert.equal(result.output, undefined);
});

test("M4 delegates cognition to its injected real executor", async () => {
  const module = new MindModule(async (input, context) => ({
    content: "processed:" + input,
    metadata: { contextKeys: Object.keys(context) },
  }));

  const result = await module.process("hello", { source: "test" });
  assert.equal(result.status, "completed");
  assert.equal(result.execution, "real");
  assert.equal(result.output, "processed:hello");
  assert.deepEqual(result.metadata, { contextKeys: ["source"] });
});
