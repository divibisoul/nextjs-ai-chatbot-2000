import test from 'node:test';
import assert from 'node:assert/strict';
import { createN01ToN06Request, validateN06ToN01Response, isN01N06Pair } from './N01N06FusionContract';

test('N01 creates a canonical correlated N06 request', () => {
  const request = createN01ToN06Request('mesh.describe', { sourceIntent: 'fusion-check' });
  assert.equal(request.protocol, 'soul-mesh/1');
  assert.equal(request.source, 'N01');
  assert.equal(request.target, 'N06');
  assert.equal(request.kind, 'request');
  assert.ok(request.correlationId);
});

test('N06 response must reverse source/target and preserve correlation', () => {
  const request = createN01ToN06Request('mesh.describe', {});
  const response = { ...request, id: crypto.randomUUID(), source: 'N06' as const, target: 'N01' as const, kind: 'response' as const, payload: { ok: true } };
  assert.equal(validateN06ToN01Response(request, response), true);
  assert.equal(validateN06ToN01Response(request, { ...response, correlationId: crypto.randomUUID() }), false);
});

test('fusion pair is bidirectional but nucleus identity remains independent', () => {
  assert.equal(isN01N06Pair('N01', 'N06'), true);
  assert.equal(isN01N06Pair('N06', 'N01'), true);
  assert.equal(isN01N06Pair('N01', 'N05'), false);
});
