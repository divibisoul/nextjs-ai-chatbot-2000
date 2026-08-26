import test from 'node:test';
import assert from 'node:assert/strict';
import { nucleus05Processor } from './Nucleus05Processor';

test('Nucleus 05 exposes required capabilities', () => {
  assert.equal(nucleus05Processor.supports('ai-pilot'), true);
  assert.equal(nucleus05Processor.supports('tool-execution'), true);
  assert.equal(nucleus05Processor.supports('mesh-communication'), true);
});

test('Nucleus 05 rejects an unconnected AI pilot', async () => {
  await assert.rejects(
    nucleus05Processor.execute({ capability: 'ai-pilot', input: 'test' }),
    /No AI pilot is connected to Nucleus 05/,
  );
});
