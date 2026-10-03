import type { N06Context } from './N06Processor';

const UPSTREAM_COMMIT = '11cdf466d042aece04fc6cfd13b28e1a70341b1f';
const DEFAULT_ROOT = 'integrations/soul-upstream/metagpt';
const DEFAULT_TIMEOUT_MS = 120_000;
const MAX_TIMEOUT_MS = 300_000;

type FetchLike = typeof fetch;
function env(name: string): string { return String(process.env[name] ?? '').trim(); }
function obj(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('METAGPT_INPUT_MUST_BE_OBJECT');
  return input as Record<string, unknown>;
}
function rounds(value: unknown): number {
  const n = Number(value ?? 3);
  return Number.isFinite(n) ? Math.max(1, Math.min(20, Math.trunc(n))) : 3;
}
function timeout(value: unknown): number {
  const n = Number(value ?? DEFAULT_TIMEOUT_MS);
  return Number.isFinite(n) ? Math.max(1000, Math.min(MAX_TIMEOUT_MS, Math.trunc(n))) : DEFAULT_TIMEOUT_MS;
}
export function metaGPTConfigured(): boolean { return Boolean(env('N06_METAGPT_URL') || env('N06_METAGPT_LOCAL_PYTHON')); }
export function metaGPTStatus() {
  return { provider: 'FoundationAgents/MetaGPT', upstreamCommit: UPSTREAM_COMMIT, sourceRoot: env('N06_METAGPT_ROOT') || DEFAULT_ROOT, remoteConfigured: Boolean(env('N06_METAGPT_URL')), localConfigured: Boolean(env('N06_METAGPT_LOCAL_PYTHON')), state: metaGPTConfigured() ? 'CONFIGURED' : 'BLOCKED' };
}
async function remote(value: Record<string, unknown>, correlationId: string, fetchImpl: FetchLike) {
  const base = env('N06_METAGPT_URL');
  if (!base) throw new Error('METAGPT_REMOTE_ENDPOINT_NOT_CONFIGURED');
  let url: URL;
  try { url = new URL('/execute', base.replace(/\/$/, '') + '/'); } catch { throw new Error('METAGPT_REMOTE_ENDPOINT_INVALID'); }
  if (!/^https?:$/.test(url.protocol)) throw new Error('METAGPT_REMOTE_ENDPOINT_PROTOCOL_INVALID');
  const res = await fetchImpl(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json', ...(env('N06_METAGPT_TOKEN') ? { authorization: 'Bearer ' + env('N06_METAGPT_TOKEN') } : {}), 'x-soul-correlation-id': correlationId },
    body: JSON.stringify({ goal: value.goal, maxRounds: rounds(value.maxRounds), root: env('N06_METAGPT_ROOT') || DEFAULT_ROOT, upstreamCommit: UPSTREAM_COMMIT })
  });
  const raw = await res.text();
  let payload: unknown;
  try { payload = raw ? JSON.parse(raw) : null; } catch { throw new Error('METAGPT_REMOTE_RESPONSE_JSON_INVALID'); }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('METAGPT_REMOTE_RESPONSE_OBJECT_REQUIRED');
  if (!res.ok) throw new Error('METAGPT_REMOTE_ERROR:' + res.status);
  return payload as Record<string, unknown>;
}
async function local(value: Record<string, unknown>, correlationId: string) {
  const python = env('N06_METAGPT_LOCAL_PYTHON') || 'python3';
  const runner = env('N06_METAGPT_RUNNER') || 'scripts/n06-metagpt-runner.py';
  const root = env('N06_METAGPT_ROOT') || DEFAULT_ROOT;
  const childProcess = await import('node:child_process');
  return await new Promise<Record<string, unknown>>((resolve, reject) => {
    const child = childProcess.spawn(python, [runner], { cwd: process.cwd(), env: { ...process.env, N06_METAGPT_ROOT: root, SOUL_CORRELATION_ID: correlationId }, stdio: ['pipe','pipe','pipe'] });
    let out = ''; let err = ''; let done = false;
    const finish = (fn: () => void) => { if (done) return; done = true; clearTimeout(timer); fn(); };
    const timer = setTimeout(() => { child.kill('SIGTERM'); finish(() => reject(new Error('METAGPT_LOCAL_TIMEOUT'))); }, timeout(value.timeoutMs));
    child.stdout.on('data', c => { out += String(c); if (out.length > 4 * 1024 * 1024) { child.kill('SIGKILL'); finish(() => reject(new Error('METAGPT_LOCAL_OUTPUT_TOO_LARGE'))); } });
    child.stderr.on('data', c => { err += String(c); if (err.length > 1024 * 1024) err = err.slice(-1024 * 1024); });
    child.on('error', e => finish(() => reject(e)));
    child.on('close', code => finish(() => { if (code !== 0) return reject(new Error('METAGPT_LOCAL_EXIT:' + String(code) + ':' + err.trim())); try { const parsed = JSON.parse(out.trim()) as Record<string, unknown>; resolve(parsed); } catch { reject(new Error('METAGPT_LOCAL_RESPONSE_JSON_INVALID')); } }));
    child.stdin.end(JSON.stringify({ goal: value.goal, maxRounds: rounds(value.maxRounds), root, upstreamCommit: UPSTREAM_COMMIT, correlationId }));
  });
}
export async function executeMetaGPTProject(input: unknown, correlationId: string, fetchImpl: FetchLike = fetch, context?: N06Context) {
  const value = obj(input);
  const goal = typeof value.goal === 'string' ? value.goal.trim() : '';
  if (!goal) throw new Error('METAGPT_GOAL_REQUIRED');
  const correlation = correlationId.trim();
  if (!correlation) throw new Error('METAGPT_CORRELATION_REQUIRED');
  const payload = env('N06_METAGPT_URL') ? await remote(value, correlation, fetchImpl) : await local(value, correlation);
  if (String(payload.state ?? '') !== 'PASS') throw new Error('METAGPT_RUNTIME_BLOCKED:' + String(payload.code ?? 'UNKNOWN'));
  return { nucleus: 'N06', provider: 'FoundationAgents/MetaGPT', upstreamCommit: UPSTREAM_COMMIT, correlationId: correlation, contextMetadata: context?.metadata ?? {}, payload };
}