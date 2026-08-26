import test from 'node:test';
import assert from 'node:assert/strict';
import { createNucleus05Request, validateNucleus05Response } from './Nucleus05E2EContract';

test('Nucleus 05 creates correlated requests', () => {
  const request = createNucleus05Request('eternium', 'context-orchestration', { ping: true });
  assert.equal(request.source, 'chatbot-2000');
  assert.equal(request.target, 'eternium');
  assert.equal(request.protocol, 'soul-mesh/1');
  assert.ok(request.correlationId);
});

test('Nucleus 05 validates reverse correlated responses', () => {
  const request = createNucleus05Request('nexus', 'mesh-communication', {});
  const response = { ...request, id: crypto.randomUUID(), source: 'nexus' as const, target: 'chatbot-2000' as const, kind: 'response' as const };
  assert.equal(validateNucleus05Response(request, response), true);
  assert.equal(validateNucleus05Response(request, { ...response, correlationId: crypto.randomUUID() }), false);
});
