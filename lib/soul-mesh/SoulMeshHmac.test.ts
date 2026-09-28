import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createSoulMeshNonce,
  signSoulMeshMessage,
  signSoulMeshResponse,
  verifySoulMeshMessage,
  verifySoulMeshResponse,
} from './SoulMeshHmac';
import type { SoulMeshMessage } from './SoulMeshProtocol';

const secret = '0123456789abcdef0123456789abcdef';

function request(): SoulMeshMessage {
  return {
    protocol: 'soul-mesh/1',
    contractVersion: '1.1.0',
    id: 'req-1',
    correlationId: 'corr-1',
    source: 'N06',
    target: 'N07',
    kind: 'request',
    capability: 'mesh.describe',
    payload: { probe: true },
    timestamp: Date.now(),
    transport: 'HTTP',
    meta: {
      runtime: 'nextjs-ai-chatbot-2000',
      transport: 'HTTP',
      encoding: 'json',
      version: '1.1.0',
      traceId: 'corr-1',
    },
  };
}

test('request HMAC signs and verifies with contractVersion included', () => {
  const message = request();
  const nonce = createSoulMeshNonce();
  const signature = signSoulMeshMessage(message, secret, nonce);
  assert.equal(verifySoulMeshMessage({ ...message, nonce, hmac: signature }, secret, nonce, signature), true);
  assert.equal(
    verifySoulMeshMessage({ ...message, nonce, hmac: signature[0] === '0' ? '1' + signature.slice(1) : '0' + signature.slice(1) }, secret, nonce, signature[0] === '0' ? '1' + signature.slice(1) : '0' + signature.slice(1)),
    false,
  );
});

test('response HMAC preserves correlation and route identity', () => {
  const message = request();
  const signed = signSoulMeshResponse(message, { ok: true }, 'response', secret);
  const response = { ...signed.message, nonce: signed.nonce, hmac: signed.hmac };
  assert.equal(response.contractVersion, '1.1.0');
  assert.equal(response.source, 'N07');
  assert.equal(response.target, 'N06');
  assert.equal(verifySoulMeshResponse(message, response, secret), true);
});

test('response HMAC rejects wrong target or correlation', () => {
  const message = request();
  const signed = signSoulMeshResponse(message, { ok: true }, 'response', secret);
  const response = { ...signed.message, nonce: signed.nonce, hmac: signed.hmac };
  assert.equal(
    verifySoulMeshResponse(message, { ...response, target: 'N05' }, secret),
    false,
  );
  assert.equal(
    verifySoulMeshResponse(message, { ...response, correlationId: 'wrong' }, secret),
    false,
  );
});
