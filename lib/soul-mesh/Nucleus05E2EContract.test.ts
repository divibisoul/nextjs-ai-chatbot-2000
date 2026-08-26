import test from 'node:test';
import assert from 'node:assert/strict';
import { createNucleus06Request, validateNucleus06Response } from './Nucleus05E2EContract';

test('N06 creates canonical correlated requests', () => {
  const request = createNucleus06Request('N02', 'context-orchestration', { context: true });
  assert.equal(request.source, 'N06');
  assert.equal(request.target, 'N02');
  assert.equal(request.protocol, 'soul-mesh/1');
  assert.ok(request.correlationId);
});

test('N06 validates reverse correlated responses', () => {
  const request = createNucleus06Request('N03', 'mesh-communication', {});
  const response = { ...request, id: crypto.randomUUID(), source: 'N03' as const, target: 'N06' as const, kind: 'response' as const };
  assert.equal(validateNucleus06Response(request, response), true);
  assert.equal(validateNucleus06Response(request, { ...response, correlationId: crypto.randomUUID() }), false);
});
