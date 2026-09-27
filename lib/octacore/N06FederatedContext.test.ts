import test from 'node:test';
import assert from 'node:assert/strict';
import { executeN06FederatedContext } from './N06FederatedContext';

test('N06 G6 preserves correlation and consumes the N07 federated context result', async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.SOUL_MESH_N07_URL;
  const originalSecret = process.env.SOUL_MESH_HMAC_SECRET;
  process.env.SOUL_MESH_N07_URL = 'https://n07.test/api/soul-mesh';
  process.env.SOUL_MESH_HMAC_SECRET = 'g6-test-secret-123456789';

  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    const request = JSON.parse(String(init?.body)) as Record<string, unknown>;
    assert.equal(request.target, 'N07');
    assert.equal(request.capability, 'octacore.federated_context_cycle');
    assert.equal(request.correlationId, 'g6-flow-001');
    const body = {
      protocol: 'soul-mesh/1',
      contractVersion: '1.1.0',
      id: 'n07-response-001',
      correlationId: 'g6-flow-001',
      source: 'N07',
      target: 'N06',
      kind: 'response',
      capability: 'octacore.federated_context_cycle',
      payload: {
        metadata: {
          octacore_json: JSON.stringify({
            correlationId: 'g6-flow-001',
            research: { ok: true },
            perception: { ok: true },
            audit: { ok: true },
            cycle: { ok: true, cycle_id: 'g6-flow-001' },
            barrier: 'pre',
          }),
        },
      },
      timestamp: Date.now(),
    };
    return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;

  try {
    const result = await executeN06FederatedContext({
      correlationId: 'g6-flow-001',
      input: 'real N06 to N07 federated flow',
      researchPayload: { query: 'context' },
      perceptionPayload: { capability: 'mesh.describe' },
    });
    assert.equal(result.correlationId, 'g6-flow-001');
    assert.equal(result.cycle.ok, true);
    assert.equal(result.barrier, 'pre');
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.SOUL_MESH_N07_URL;
    else process.env.SOUL_MESH_N07_URL = originalUrl;
    if (originalSecret === undefined) delete process.env.SOUL_MESH_HMAC_SECRET;
    else process.env.SOUL_MESH_HMAC_SECRET = originalSecret;
  }
});
