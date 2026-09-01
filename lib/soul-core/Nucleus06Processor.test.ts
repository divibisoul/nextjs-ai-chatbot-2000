import test from 'node:test';
import assert from 'node:assert/strict';
import { nucleus06Processor } from './N06Processor';
import { authorizeN06Capability, enforceN06Step } from './N06ExecutionPolicy';

test('N06 exposes canonical capabilities and executes registered support handlers', async () => {
  nucleus06Processor.registerHandler('support.context', async (input) => ({ input }));
  assert.equal(nucleus06Processor.supports('support.context'), true);
  assert.equal(nucleus06Processor.supports('support.documents'), false);
  assert.equal(nucleus06Processor.supports('ai-pilot'), false);
  assert.deepEqual(await nucleus06Processor.execute({ capability: 'support.context', input: 'x' }), { input: 'x' });
});

test('N06 execution policy rejects unknown capabilities and bounds steps', () => {
  assert.equal(authorizeN06Capability('support.context'), true);
  assert.equal(authorizeN06Capability('ai-pilot'), false);
  assert.throws(() => enforceN06Step(6), /N06_STEP_LIMIT/);
  assert.doesNotThrow(() => enforceN06Step(5));
});
