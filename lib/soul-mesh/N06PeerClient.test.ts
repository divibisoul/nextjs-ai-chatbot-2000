import test from 'node:test';
import assert from 'node:assert/strict';
import { N06PeerClient } from './N06PeerClient';

test('N06 outbound request is correlated and route-safe', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_input, init) => {
    const request = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({
      ...request,
      id: crypto.randomUUID(),
      source: 'N01',
      target: 'N06',
      kind: 'response',
      payload: { ok: true },
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  try {
    const client = new N06PeerClient({ endpoint: 'https://n01.invalid/api/soul-mesh', timeoutMs: 1000, retries: 0 });
    const result = await client.request('N01', 'mesh.health', {});
    assert.equal(result.source, 'N01');
    assert.equal(result.target, 'N06');
    assert.equal(result.kind, 'response');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('N06 rejects a response with the wrong correlation', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_input, init) => {
    const request = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ ...request, id: crypto.randomUUID(), source: 'N01', target: 'N06', kind: 'response', correlationId: crypto.randomUUID() }), { status: 200 });
  };
  try {
    const client = new N06PeerClient({ endpoint: 'https://n01.invalid/api/soul-mesh', timeoutMs: 1000, retries: 0 });
    await assert.rejects(() => client.request('N01', 'mesh.health', {}), /CORRELATION_OR_ROUTE_MISMATCH/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
