import test from 'node:test';
import assert from 'node:assert/strict';
import { createSoulMeshMessage, isSoulMeshMessage } from './SoulMeshProtocol';
import { handleMeshMessage } from './endpoint';

test('N06 accepts a valid mesh request and preserves correlation', async () => {
  const message = createSoulMeshMessage({
    correlationId: 'test-correlation',
    source: 'N01',
    target: 'N06',
    kind: 'request',
    capability: 'mesh.ping',
    payload: { hello: 'N06' },
  });

  assert.equal(isSoulMeshMessage(message), true);
  const response = await handleMeshMessage(message, {
    'mesh.ping': payload => ({ ok: true, payload }),
  });

  assert.equal(response.kind, 'response');
  assert.equal(response.correlationId, 'test-correlation');
  assert.equal(response.source, 'N06');
  assert.equal(response.target, 'N01');
});

test('N06 returns a typed error for an unregistered capability', async () => {
  const message = createSoulMeshMessage({
    correlationId: 'missing-capability',
    source: 'N05',
    target: 'N06',
    kind: 'request',
    capability: 'not.registered',
    payload: null,
  });

  const response = await handleMeshMessage(message, {});
  assert.equal(response.kind, 'error');
  assert.equal((response.payload as { code: string }).code, 'CAPABILITY_NOT_FOUND');
});
