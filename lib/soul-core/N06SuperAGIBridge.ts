import type { N06Context } from './N06Processor';

const UPSTREAM_COMMIT = 'c3c1982e7bd6a11cfed53c5a193ea502f924b1b6';
const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_TIMEOUT_MS = 60_000;

type SuperAGIOperation =
  | 'superagi.agent.create'
  | 'superagi.agent.run'
  | 'superagi.agent.run-status'
  | 'superagi.agent.pause'
  | 'superagi.agent.resume'
  | 'superagi.agent.update';

type FetchLike = typeof fetch;

function objectInput(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('SUPERAGI_INPUT_MUST_BE_OBJECT');
  }
  return input as Record<string, unknown>;
}

function requiredAgentId(input: Record<string, unknown>): number {
  const value = Number(input.agentId ?? input.agent_id);
  if (!Number.isInteger(value) || value <= 0) throw new Error('SUPERAGI_AGENT_ID_REQUIRED');
  return value;
}

function env(name: string): string {
  return String(process.env[name] ?? '').trim();
}

export function superAGIConfigured(): boolean {
  return Boolean(env('SOUL_SUPERAGI_URL') && env('SOUL_SUPERAGI_API_KEY'));
}

export function superAGIStatus() {
  return {
    provider: 'TransformerOptimus/SuperAGI',
    upstreamCommit: UPSTREAM_COMMIT,
    configured: superAGIConfigured(),
    endpointConfigured: Boolean(env('SOUL_SUPERAGI_URL')),
    apiKeyConfigured: Boolean(env('SOUL_SUPERAGI_API_KEY')),
    operations: [
      'superagi.agent.create',
      'superagi.agent.run',
      'superagi.agent.run-status',
      'superagi.agent.pause',
      'superagi.agent.resume',
      'superagi.agent.update',
    ] as SuperAGIOperation[],
  };
}

function baseUrl(): string {
  const raw = env('SOUL_SUPERAGI_URL');
  if (!raw) throw new Error('SUPERAGI_ENDPOINT_NOT_CONFIGURED');
  try {
    const parsed = new URL(raw);
    if (!/^https?:$/.test(parsed.protocol)) throw new Error('SUPERAGI_ENDPOINT_PROTOCOL_INVALID');
    return parsed.toString().replace(/\/$/, '');
  } catch (error) {
    if (error instanceof Error && error.message === 'SUPERAGI_ENDPOINT_PROTOCOL_INVALID') throw error;
    throw new Error('SUPERAGI_ENDPOINT_INVALID');
  }
}

function timeoutMs(input: Record<string, unknown>): number {
  const value = Number(input.timeoutMs ?? input.timeout_ms ?? DEFAULT_TIMEOUT_MS);
  if (!Number.isFinite(value)) return DEFAULT_TIMEOUT_MS;
  return Math.max(250, Math.min(MAX_TIMEOUT_MS, Math.trunc(value)));
}

function routeFor(capability: SuperAGIOperation, input: Record<string, unknown>): {
  path: string;
  method: 'POST' | 'PUT';
  body: unknown;
} {
  const body = input.body ?? input.input ?? {};
  switch (capability) {
    case 'superagi.agent.create':
      return { path: '/v1/agent', method: 'POST', body };
    case 'superagi.agent.run':
      return { path: `/v1/agent/${requiredAgentId(input)}/run`, method: 'POST', body };
    case 'superagi.agent.run-status':
      return { path: `/v1/agent/${requiredAgentId(input)}/run-status`, method: 'POST', body };
    case 'superagi.agent.pause':
      return { path: `/v1/agent/${requiredAgentId(input)}/pause`, method: 'POST', body };
    case 'superagi.agent.resume':
      return { path: `/v1/agent/${requiredAgentId(input)}/resume`, method: 'POST', body };
    case 'superagi.agent.update':
      return { path: `/v1/agent/${requiredAgentId(input)}`, method: 'PUT', body };
  }
}

function validateResponse(value: unknown): unknown {
  if (!value || typeof value !== 'object') throw new Error('SUPERAGI_RESPONSE_JSON_REQUIRED');
  return value;
}

export async function executeSuperAGICapability(
  capability: string,
  input: unknown,
  correlationId: string,
  fetchImpl: FetchLike = fetch,
  context?: N06Context,
): Promise<unknown> {
  const normalizedCapability = capability.trim() as SuperAGIOperation;
  if (![
    'superagi.agent.create',
    'superagi.agent.run',
    'superagi.agent.run-status',
    'superagi.agent.pause',
    'superagi.agent.resume',
    'superagi.agent.update',
  ].includes(normalizedCapability)) {
    throw new Error(`SUPERAGI_CAPABILITY_UNSUPPORTED:${capability}`);
  }

  const correlation = correlationId.trim();
  if (!correlation) throw new Error('SUPERAGI_CORRELATION_REQUIRED');
  if (!superAGIConfigured()) throw new Error('SUPERAGI_NOT_CONFIGURED');

  const inputObject = objectInput(input);
  if (normalizedCapability === 'superagi.agent.create') {
    const createBody = inputObject.body ?? inputObject.input ?? inputObject;
    if (!createBody || typeof createBody !== 'object' || Array.isArray(createBody)) {
      throw new Error('SUPERAGI_CREATE_BODY_REQUIRED');
    }
  } else {
    requiredAgentId(inputObject);
  }

  const route = routeFor(normalizedCapability, inputObject);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs(inputObject));

  try {
    const response = await fetchImpl(new URL(route.path, `${baseUrl()}/`).toString(), {
      method: route.method,
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        'X-API-Key': env('SOUL_SUPERAGI_API_KEY'),
        'X-Correlation-ID': correlation,
        'x-soul-correlation-id': correlation,
      },
      body: JSON.stringify(route.body ?? {}),
      signal: controller.signal,
    });

    const raw = await response.text();
    let parsed: unknown = null;
    try { parsed = raw ? JSON.parse(raw) : null; } catch {
      throw new Error('SUPERAGI_RESPONSE_JSON_INVALID');
    }

    const payload = validateResponse(parsed);
    if (!response.ok) {
      throw new Error(`SUPERAGI_REMOTE_ERROR:${response.status}`);
    }

    return {
      nucleus: 'N06',
      provider: 'TransformerOptimus/SuperAGI',
      upstreamCommit: UPSTREAM_COMMIT,
      capability: normalizedCapability,
      correlationId: correlation,
      contextMetadata: context?.metadata ?? {},
      payload,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('SUPERAGI_TIMEOUT');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
