import assert from 'node:assert/strict';
import test from 'node:test';
import {
  requestN07CooperationExchange,
  requestN07CooperationHandshake,
} from './N06CooperationBridge';

const originalFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.SOUL_MESH_N07_URL;
  delete process.env.SOUL_MESH_HMAC_SECRET;
  delete process.env.SOUL_MESH_SECRET;
});

function installFakeN07Fetch() {
  process.env.SOUL_MESH_N07_URL = 'http://n07.test';
  delete process.env.SOUL_MESH_HMAC_SECRET;
  delete process.env.SOUL_MESH_SECRET;
  let lastBody: any;
  globalThis.fetch = async (_input: any, init?: any) => {
    lastBody = JSON.parse(String(init?.body ?? '{}'));
    return {
      ok: true,
      async json() {
        return {
          protocol: 'soul-mesh/1',
          contractVersion: '1.1.0',
          id: 'n07-response-1',
          correlationId: lastBody.correlationId,
          source: 'N07',
          target: 'N06',
          kind: 'response',
          capability: lastBody.capability,
          payload: { status: 'ready', accepted: true },
          timestamp: Date.now(),
        };
      },
    } as any;
  };
  return () => lastBody;
}

test('N06 handshake reaches N07 cooperative control plane with structured payload', async () => {
  const body = installFakeN07Fetch();
  const result = await requestN07CooperationHandshake({
    target: 'N02',
    requiredCapability: 'gemini.text.generate',
    correlationId: 'n06-coop-handshake',
  });

  assert.deepEqual(result, { status: 'ready', accepted: true });
  const sent = body();
  assert.equal(sent.source, 'N06');
  assert.equal(sent.target, 'N07');
  assert.equal(sent.capability, 'cooperation.handshake');
  assert.equal(sent.payload.target, 'N02');
  assert.equal(sent.payload.required_capability, 'gemini.text.generate');
});

test('N06 exchange reaches N07 and preserves target capability and payload', async () => {
  const body = installFakeN07Fetch();
  const result = await requestN07CooperationExchange({
    target: 'N05',
    capability: 'inference.analyze',
    payload: { prompt: 'cooperative continuity' },
    correlationId: 'n06-coop-exchange',
  });

  assert.deepEqual(result, { status: 'ready', accepted: true });
  const sent = body();
  assert.equal(sent.capability, 'cooperation.exchange');
  assert.equal(sent.payload.target, 'N05');
  assert.equal(sent.payload.capability, 'inference.analyze');
  assert.deepEqual(sent.payload.payload, { prompt: 'cooperative continuity' });
});
