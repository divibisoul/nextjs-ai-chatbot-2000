import test from 'node:test';
import assert from 'node:assert/strict';
import { requiresN06MeshUserContext } from './N06CapabilityDispatcher';

test('N06 only requires user context for contextual Mesh capabilities', () => {
  assert.equal(requiresN06MeshUserContext('support.mesh'), false);
  assert.equal(requiresN06MeshUserContext('support.context'), false);
  assert.equal(requiresN06MeshUserContext('support.documents'), true);
  assert.equal(requiresN06MeshUserContext('support.artifacts'), true);
  assert.equal(requiresN06MeshUserContext('support.tool-execution'), true);
  assert.equal(requiresN06MeshUserContext('tool:createDocument'), true);
  assert.equal(requiresN06MeshUserContext('tool:getWeather'), true);
});
