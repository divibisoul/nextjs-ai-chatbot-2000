import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { describeSmolAgentsAdapter } from './SmolAgentsAdapter';
import { describeDSPyAdapter } from './DSPyAdapter';
import { describeOpenHandsAdapter } from './OpenHandsAdapter';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

describe('N06 external agent augmenters', () => {
  test('smolagents is never PASS from structure alone', () => {
    const original = process.env.SOUL_N06_SMOLAGENTS_ENABLED;
    Reflect.deleteProperty(process.env, 'SOUL_N06_SMOLAGENTS_ENABLED');
    try {
      assert.equal(describeSmolAgentsAdapter().state, 'DEGRADED');
    } finally {
      if (original === undefined) Reflect.deleteProperty(process.env, 'SOUL_N06_SMOLAGENTS_ENABLED');
      else process.env.SOUL_N06_SMOLAGENTS_ENABLED = original;
    }
  });

  test('empty submodule directories do not count as provider source', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'soul-n06-empty-provider-'));
    const original = {
      openhands: process.env.SOUL_N06_OPENHANDS_ROOT,
      smolagents: process.env.SOUL_N06_SMOLAGENTS_ROOT,
      dspy: process.env.SOUL_N06_DSPY_ROOT,
    };
    try {
      process.env.SOUL_N06_OPENHANDS_ROOT = root;
      process.env.SOUL_N06_SMOLAGENTS_ROOT = root;
      process.env.SOUL_N06_DSPY_ROOT = root;
      assert.equal(describeOpenHandsAdapter().sourcePresent, false);
      assert.equal(describeSmolAgentsAdapter().sourcePresent, false);
      assert.equal(describeDSPyAdapter().sourcePresent, false);
    } finally {
      if (original.openhands === undefined) Reflect.deleteProperty(process.env, 'SOUL_N06_OPENHANDS_ROOT');
      else process.env.SOUL_N06_OPENHANDS_ROOT = original.openhands;
      if (original.smolagents === undefined) Reflect.deleteProperty(process.env, 'SOUL_N06_SMOLAGENTS_ROOT');
      else process.env.SOUL_N06_SMOLAGENTS_ROOT = original.smolagents;
      if (original.dspy === undefined) Reflect.deleteProperty(process.env, 'SOUL_N06_DSPY_ROOT');
      else process.env.SOUL_N06_DSPY_ROOT = original.dspy;
      rmSync(root, { recursive: true, force: true });
    }
  });

  test('DSPy is never PASS from structure alone', () => {
    const original = process.env.SOUL_N06_DSPY_ENABLED;
    Reflect.deleteProperty(process.env, 'SOUL_N06_DSPY_ENABLED');
    try {
      assert.equal(describeDSPyAdapter().state, 'DEGRADED');
    } finally {
      if (original === undefined) Reflect.deleteProperty(process.env, 'SOUL_N06_DSPY_ENABLED');
      else process.env.SOUL_N06_DSPY_ENABLED = original;
    }
  });
});
