import test from 'node:test';
import assert from 'node:assert/strict';
import { saraHealth, saraCapabilities, saraState, saraAudit, saraRegenerate, saraTrace } from './SARAClient';

test('N06 preserves upstream diagnostic detail for SARA auxiliary HTTP errors', async () => {
  const originalFetch = globalThis.fetch;
  const oldUrl = process.env.SARA_BASE_URL;
  const oldToken = process.env.SARA_API_TOKEN;
  process.env.SARA_BASE_URL = 'http://sara.test';
  process.env.SARA_API_TOKEN = 'test-token';
  globalThis.fetch = async () => new Response(
    JSON.stringify({ error: { message: 'upstream rejected input' } }),
    { status: 422, headers: { 'content-type': 'application/json' } },
  );
  try {
    await assert.rejects(
      () => saraAudit('input', 'n06-audit-error-001'),
      /SARA_HTTP_422:upstream rejected input/,
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (oldUrl === undefined) Reflect.deleteProperty(process.env, 'SARA_BASE_URL');
    else process.env.SARA_BASE_URL = oldUrl;
    if (oldToken === undefined) Reflect.deleteProperty(process.env, 'SARA_API_TOKEN');
    else process.env.SARA_API_TOKEN = oldToken;
  }
});

test('N06 exposes additive SARA operations beyond chat cycle', async () => {
  const originalFetch = globalThis.fetch;
  const oldUrl = process.env.SARA_BASE_URL;
  const oldToken = process.env.SARA_API_TOKEN;
  let observed: { path: string; method: string; auth?: string; correlation?: string } | null = null;

  process.env.SARA_BASE_URL = 'http://sara.test';
  Reflect.deleteProperty(process.env, 'SARA_API_TOKEN');

  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const path = new URL(url).pathname;
    observed = {
      path,
      method: String(init?.method ?? 'GET'),
      auth: (init?.headers as Record<string, string> | undefined)?.authorization,
      correlation: (init?.headers as Record<string, string> | undefined)?.['X-Correlation-ID'],
    };
    return new Response(JSON.stringify({ ok: true, correlation_id: observed.correlation }), {
      status: 200,
      headers: { 'content-type': 'application/json', 'X-Correlation-ID': observed.correlation ?? '' },
    });
  };

  try {
    const health = await saraHealth();
    assert.equal(health.ok, true);
    assert.equal(observed?.path, '/health');
    assert.equal(observed?.auth, undefined);

    process.env.SARA_API_TOKEN = 'token';
    await saraCapabilities();
    assert.equal(observed?.path, '/v1/capabilities');
    await saraState();
    assert.equal(observed?.path, '/v1/state');

    await saraAudit('auditar contexto', 'n06-audit-001');
    assert.equal(observed?.path, '/v1/audit');
    assert.equal(observed?.method, 'POST');
    assert.equal(observed?.correlation, 'n06-audit-001');

    await saraRegenerate('regenerar contexto', 'n06-regenerate-001');
    assert.equal(observed?.path, '/v1/regenerate');
    assert.equal(observed?.correlation, 'n06-regenerate-001');

    await saraTrace('n06-cycle-001');
    assert.equal(observed?.path, '/v1/trace/n06-cycle-001');
    assert.equal(observed?.correlation, 'n06-cycle-001');
  } finally {
    globalThis.fetch = originalFetch;
    if (oldUrl === undefined) Reflect.deleteProperty(process.env, 'SARA_BASE_URL');
    else process.env.SARA_BASE_URL = oldUrl;
    if (oldToken === undefined) Reflect.deleteProperty(process.env, 'SARA_API_TOKEN');
    else process.env.SARA_API_TOKEN = oldToken;
  }
});
