import assert from 'node:assert/strict';
import test from 'node:test';
import { signSoulMeshMessage, verifySoulMeshMessage, signSoulMeshResponse, verifySoulMeshResponse } from './SoulMeshHmac';
import type { SoulMeshMessage } from './SoulMeshProtocol';
import { createHmac } from 'node:crypto';
import { createServer } from 'node:http';
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
    payload: { capability: 'mesh.ping', payload: { contractVersion: '1.1.0', nucleus: 'N07', ok: true } },
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


test('N05 metadata transport canonicalization is accepted by N06', () => {
  const message: SoulMeshMessage = {
    ...request(),
    source: 'N05',
    target: 'N06',
    // The canonical HMAC transport value comes from meta.transport, exactly
    // as N05 signs it, even if an out-of-band top-level alias is present.
    transport: 'REALTIME',
    meta: {
      runtime: 'nextjs-ai-chatbot',
      transport: 'HTTP',
      encoding: 'json',
      version: '1.1.0',
      nonce: 'n05-shared-canonical-request-nonce',
    },
  };
  const nonce = 'n05-shared-canonical-request-nonce';
  // Independent copy of N05's stable canonical field order; this intentionally
  // omits a top-level transport and obtains HTTP from meta.transport.
  const n05Canonical = JSON.stringify({
    protocol: message.protocol,
    contractVersion: message.contractVersion,
    id: message.id,
    correlationId: message.correlationId,
    source: message.source,
    target: message.target,
    kind: message.kind,
    capability: message.capability ?? null,
    payload: message.payload,
    timestamp: message.timestamp,
    transport: message.meta?.transport,
    meta: message.meta ?? null,
    nonce,
  });
  const n05Signature = createHmac('sha256', secret).update(n05Canonical, 'utf8').digest('hex');
  assert.equal(verifySoulMeshMessage(message, secret, nonce, n05Signature), true);
});

test('N06 verifies a canonical N05 HTTP response with metadata-only transport', () => {
  const input: SoulMeshMessage = {
    ...request(),
    source: 'N06',
    target: 'N05',
    transport: undefined,
    meta: {
      runtime: 'nextjs-ai-chatbot-2000',
      transport: 'HTTP',
      encoding: 'json',
      version: '1.1.0',
      traceId: 'n05-n06-response-correlation',
    },
    correlationId: 'n05-n06-response-correlation',
  };
  const nonce = 'n05-shared-canonical-response-nonce';
  const response: SoulMeshMessage = {
    protocol: 'soul-mesh/1',
    contractVersion: '1.1.0',
    id: 'n05-canonical-response',
    correlationId: input.correlationId,
    source: 'N05',
    target: 'N06',
    kind: 'response',
    capability: input.capability,
    payload: { ok: true, nucleus: 'N05' },
    timestamp: Date.now(),
    nonce,
    meta: {
      runtime: 'nextjs-ai-chatbot',
      transport: 'HTTP',
      encoding: 'json',
      version: '1.1.0',
      nonce,
      traceId: input.correlationId,
    },
  };
  const n05Canonical = JSON.stringify({
    protocol: response.protocol,
    contractVersion: response.contractVersion,
    id: response.id,
    correlationId: response.correlationId,
    source: response.source,
    target: response.target,
    kind: response.kind,
    capability: response.capability ?? null,
    payload: response.payload,
    timestamp: response.timestamp,
    transport: response.meta?.transport,
    meta: response.meta ?? null,
    nonce,
  });
  const hmac = createHmac('sha256', secret).update(n05Canonical, 'utf8').digest('hex');
  assert.equal(verifySoulMeshResponse(input, { ...response, hmac }, secret), true);
});

test('N06 peer client sends Bearer and canonical HMAC together in production', async () => {
  const originalUrl = process.env.SOUL_MESH_N05_URL;
  const originalSecret = process.env.SOUL_MESH_HMAC_SECRET;
  const originalToken = process.env.SOUL_MESH_TOKEN;
  const originalNodeEnv = process.env.NODE_ENV;
  const token = 'n06-n05-dual-auth-loopback-token';
  let observed: { authorization: string | undefined; requestHmacValid: boolean } | undefined;
  const server = createServer(async (incomingRequest, outgoingResponse) => {
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of incomingRequest) chunks.push(Buffer.from(chunk));
      const incoming = JSON.parse(Buffer.concat(chunks).toString('utf8')) as SoulMeshMessage;
      const nonce = String(incomingRequest.headers['x-soul-mesh-nonce'] ?? '');
      const hmac = String(incomingRequest.headers['x-soul-mesh-hmac'] ?? '');
      observed = {
        authorization: incomingRequest.headers.authorization,
        requestHmacValid: verifySoulMeshMessage(incoming, secret, nonce, hmac),
      };
      const signed = signSoulMeshResponse(incoming, { ok: true, nucleus: 'N05' }, 'response', secret);
      outgoingResponse.writeHead(200, { 'content-type': 'application/json' });
      outgoingResponse.end(JSON.stringify({
        ...signed.message,
        nonce: signed.nonce,
        hmac: signed.hmac,
      }));
    } catch (error) {
      outgoingResponse.writeHead(500, { 'content-type': 'text/plain' });
      outgoingResponse.end(error instanceof Error ? error.message : String(error));
    }
  });

  process.env.NODE_ENV = 'production';
  process.env.SOUL_MESH_HMAC_SECRET = secret;
  process.env.SOUL_MESH_TOKEN = token;

  try {
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    process.env.SOUL_MESH_N05_URL = `http://127.0.0.1:${address.port}`;

    // Import after setting the endpoint because N06's peer URL table is built
    // once at module initialization.
    const { sendTo } = await import('./peer-client');
    const result = await sendTo('N05', 'mesh.ping', { probe: 'n06-n05-dual-auth' }, 3000);

    assert.equal(observed?.authorization, `Bearer ${token}`);
    assert.equal(observed?.requestHmacValid, true);
    assert.equal(result.source, 'N05');
    assert.equal(result.target, 'N06');
    assert.deepEqual(result.payload, { ok: true, nucleus: 'N05' });
  } finally {
    try {
      if (server.listening) {
        await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
      }
    } finally {
      if (originalUrl === undefined) delete process.env.SOUL_MESH_N05_URL;
      else process.env.SOUL_MESH_N05_URL = originalUrl;
      if (originalSecret === undefined) delete process.env.SOUL_MESH_HMAC_SECRET;
      else process.env.SOUL_MESH_HMAC_SECRET = originalSecret;
      if (originalToken === undefined) delete process.env.SOUL_MESH_TOKEN;
      else process.env.SOUL_MESH_TOKEN = originalToken;
      if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = originalNodeEnv;
    }
  }
});

