import assert from 'node:assert/strict';
import test from 'node:test';
import { NUCLEUS_06_CAPABILITIES } from './Nucleus06Capabilities';
import { Nucleus06Processor } from './Nucleus06Processor';

test('N06 processor exposes canonical N06 capabilities', () => {
  const processor = new Nucleus06Processor();
  assert.equal(processor.id, 'nucleus-06');
  assert.deepEqual(processor.capabilities, NUCLEUS_06_CAPABILITIES);
  assert.deepEqual(processor.executableCapabilities(), []);
});

test('N06 processor executes a registered capability handler', async () => {
  const processor = new Nucleus06Processor();
  processor.registerHandler('support.context', async (input) => ({ ok: true, input }));
  assert.deepEqual(
    await processor.execute({ capability: 'support.context', input: 'ping' }),
    { ok: true, input: 'ping' },
  );
  assert.deepEqual(processor.executableCapabilities(), ['support.context']);
});
