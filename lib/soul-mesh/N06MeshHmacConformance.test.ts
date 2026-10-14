import assert from 'node:assert/strict';
import test from 'node:test';
import { signSoulMeshMessage, verifySoulMeshMessage, signSoulMeshResponse, verifySoulMeshResponse } from './SoulMeshHmac';
import type { SoulMeshMessage } from './SoulMeshProtocol';
import { createHmac } from 'node:crypto';
import { verifyN07LegacyResponse } from './N06PeerAdapter';

const secret = '01234567890123456789012345678901';

function request(): SoulMeshMessage {
  return {
    protocol: 'soul-mesh/1',
    contractVersion: '1.1.0',
    id: 'n06-request',
    correlationId: 'n06-correlation',
    source: 'N06',
    target: 'N05',
    kind: 'request',
    capability: 'mesh.ping',
    payload: { probe: true },
    timestamp: Date.now(),
    transport: 'HTTP',
    meta: { runtime: 'nextjs-ai-chatbot-2000', transport: 'HTTP', nonce: 'n06-test-nonce' },
  };
}

test('N06 signs and verifies a canonical Mesh message with a strong key', () => {
  const message = request();
  const signature = signSoulMeshMessage(message, secret, 'n06-test-nonce');
  assert.equal(verifySoulMeshMessage(message, secret, 'n06-test-nonce', signature), true);
  assert.equal(verifySoulMeshMessage(message, secret, 'n06-test-nonce', '0'.repeat(64)), false);
});

test('N06 rejects weak HMAC keys before signing or trusting a signature', () => {
  const message = request();
  assert.throws(
    () => signSoulMeshMessage(message, 'weak-n06-secret', 'nonce'),
    /SOUL_MESH_HMAC_SECRET_TOO_SHORT/,
  );
  assert.equal(
    verifySoulMeshMessage(message, 'weak-n06-secret', 'nonce', '0'.repeat(64)),
    false,
  );
  assert.throws(
    () => signSoulMeshResponse(message, { ok: true }, 'response', 'weak-n06-secret'),
    /SOUL_MESH_HMAC_SECRET_TOO_SHORT/,
  );
});

test('N06 response signature verifies route and correlation before acceptance', () => {
  const input = request();
  const signed = signSoulMeshResponse(input, { ok: true }, 'response', secret);
  assert.equal(verifySoulMeshResponse(input, signed.message, secret), true);
  assert.equal(verifySoulMeshResponse(input, { ...signed.message, target: 'N04' }, secret), false);
  assert.equal(verifySoulMeshResponse(input, { ...signed.message, correlationId: 'other-correlation' }, secret), false);
});

test('N06 verifies the canonical Go/N07 legacy HMAC response envelope', () => {
  const request: SoulMeshMessage = {
    protocol: 'soul-mesh/1', contractVersion: '1.1.0', id: 'n06-legacy-request',
    correlationId: 'n06-legacy-correlation', source: 'N06', target: 'N07', kind: 'request',
    capability: 'mesh.ping', payload: {}, timestamp: Date.now(), transport: 'HTTP',
    meta: { runtime: 'nextjs-ai-chatbot-2000', transport: 'HTTP', encoding: 'json', version: '1.1.0', traceId: 'n06-legacy-correlation' },
  };
  const unsigned = {
    version: '1.0', contractVersion: '1.1.0', messageId: 'n07-legacy-response',
    source: 'N07', target: 'N06', timestamp: Date.now(), nonce: 'n07-legacy-nonce',
    correlationId: request.correlationId, type: 'TASK_RESULT',
    payload: { capability: 'mesh.ping', payload: { ok: true, nucleus: 'N07', contractVersion: '1.1.0' } },
  };
  const signature = createHmac('sha256', secret).update(JSON.stringify(unsigned), 'utf8').digest('hex');
  const response: SoulMeshMessage = {
    protocol: 'soul-mesh/1', contractVersion: '1.1.0', id: unsigned.messageId,
    correlationId: unsigned.correlationId, source: 'N07', target: 'N06', kind: 'response',
    capability: 'mesh.ping', payload: unsigned.payload.payload, timestamp: unsigned.timestamp,
    nonce: unsigned.nonce, hmac: signature,
  };
  assert.equal(verifyN07LegacyResponse(request, response, secret), true);
  assert.equal(verifyN07LegacyResponse(request, { ...response, payload: { ok: false } }, secret), false);
  assert.equal(verifyN07LegacyResponse(request, { ...response, correlationId: 'other-correlation' }, secret), false);
});
