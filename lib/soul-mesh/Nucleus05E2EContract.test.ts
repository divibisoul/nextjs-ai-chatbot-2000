import test from 'node:test';
import assert from 'node:assert/strict';
import { createNucleus05Request, validateNucleus05Response } from './Nucleus05E2EContract';

test('Nucleus 05 creates correlated requests with canonical identity', () => {
  const request = createNucleus05Request('N06', 'context-orchestration', { ping: true });
  assert.equal(request.source, 'N05');
  assert.equal(request.target, 'N06');
  assert.equal(request.protocol, 'soul-mesh/1');
  assert.ok(request.correlationId);
});

test('Nucleus 05 validates reverse correlated responses', () => {
  const request = createNucleus05Request('N03', 'mesh-communication', {});
  const response = { ...request, id: crypto.randomUUID(), source: 'N03' as const, target: 'N05' as const, kind: 'response' as const };
  assert.equal(validateNucleus05Response(request, response), true);
  assert.equal(validateNucleus05Response(request, { ...response, correlationId: crypto.randomUUID() }), false);
});
