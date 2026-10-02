import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { describeSmolAgentsAdapter } from './SmolAgentsAdapter';
import { describeDSPyAdapter } from './DSPyAdapter';

describe('N06 external agent augmenters',()=>{
 test('smolagents is never PASS from structure alone',()=>{
  const original=process.env.SOUL_N06_SMOLAGENTS_ENABLED;
  delete process.env.SOUL_N06_SMOLAGENTS_ENABLED;
  expect(describeSmolAgentsAdapter().state).toBe('DEGRADED');
  if(original===undefined) delete process.env.SOUL_N06_SMOLAGENTS_ENABLED; else process.env.SOUL_N06_SMOLAGENTS_ENABLED=original;
 });
 test('DSPy is never PASS from structure alone',()=>{
  const original=process.env.SOUL_N06_DSPY_ENABLED;
  delete process.env.SOUL_N06_DSPY_ENABLED;
  expect(describeDSPyAdapter().state).toBe('DEGRADED');
  if(original===undefined) delete process.env.SOUL_N06_DSPY_ENABLED; else process.env.SOUL_N06_DSPY_ENABLED=original;
 });
});
