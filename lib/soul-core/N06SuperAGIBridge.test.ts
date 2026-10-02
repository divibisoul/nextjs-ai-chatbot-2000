import assert from 'node:assert/strict';
import test from 'node:test';
import { executeSuperAGICapability } from './N06SuperAGIBridge';

function fakeResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('SuperAGI create uses the real versioned API path and preserves correlation', async () => {
  const previousUrl = process.env.SOUL_SUPERAGI_URL;
  const previousKey = process.env.SOUL_SUPERAGI_API_KEY;
  process.env.SOUL_SUPERAGI_URL = 'https://superagi.example.test';
  process.env.SOUL_SUPERAGI_API_KEY = 'test-key';

  try {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const result = await executeSuperAGICapability(
      'superagi.agent.create',
      { input: { name: 'SOUL-agent', goal: ['test'] } },
      'corr-superagi-create',
      async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} });
        return fakeResponse(200, { agent_id: 7 });
      },
    ) as Record<string, unknown>;

    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://superagi.example.test/v1/agent');
    assert.equal((calls[0].init.headers as Record<string, string>)['X-API-Key'], 'test-key');
    assert.equal((calls[0].init.headers as Record<string, string>)['X-Correlation-ID'], 'corr-superagi-create');
    assert.deepEqual(JSON.parse(String(calls[0].init.body)), { name: 'SOUL-agent', goal: ['test'] });
    assert.equal((result.payload as Record<string, unknown>).agent_id, 7);
    assert.equal(result.correlationId, 'corr-superagi-create');
  } finally {
    if (previousUrl === undefined) delete process.env.SOUL_SUPERAGI_URL; else process.env.SOUL_SUPERAGI_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SOUL_SUPERAGI_API_KEY; else process.env.SOUL_SUPERAGI_API_KEY = previousKey;
  }
});

test('SuperAGI run uses the real versioned API path', async () => {
  const previousUrl = process.env.SOUL_SUPERAGI_URL;
  const previousKey = process.env.SOUL_SUPERAGI_API_KEY;
  process.env.SOUL_SUPERAGI_URL = 'https://superagi.example.test';
  process.env.SOUL_SUPERAGI_API_KEY = 'test-key';

  try {
    const result = await executeSuperAGICapability(
      'superagi.agent.run',
      { agentId: 7, body: { name: 'run-1', goal: ['test'] } },
      'corr-superagi-run',
      async (url) => {
        assert.equal(String(url), 'https://superagi.example.test/v1/agent/7/run');
        return fakeResponse(200, { run_id: 11, status: 'CREATED' });
      },
    ) as Record<string, unknown>;

    assert.equal((result.payload as Record<string, unknown>).run_id, 11);
  } finally {
    if (previousUrl === undefined) delete process.env.SOUL_SUPERAGI_URL; else process.env.SOUL_SUPERAGI_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SOUL_SUPERAGI_API_KEY; else process.env.SOUL_SUPERAGI_API_KEY = previousKey;
  }
});

test('SuperAGI bridge fails closed when endpoint or key is absent', async () => {
  const previousUrl = process.env.SOUL_SUPERAGI_URL;
  const previousKey = process.env.SOUL_SUPERAGI_API_KEY;
  process.env.SOUL_SUPERAGI_URL = '';
  process.env.SOUL_SUPERAGI_API_KEY = '';

  try {
    await assert.rejects(
      executeSuperAGICapability('superagi.agent.run-status', { agentId: 7 }, 'corr-superagi-missing'),
      /SUPERAGI_NOT_CONFIGURED/,
    );
  } finally {
    if (previousUrl === undefined) delete process.env.SOUL_SUPERAGI_URL; else process.env.SOUL_SUPERAGI_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SOUL_SUPERAGI_API_KEY; else process.env.SOUL_SUPERAGI_API_KEY = previousKey;
  }
});
