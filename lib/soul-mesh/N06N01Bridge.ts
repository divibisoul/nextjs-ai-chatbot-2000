import { randomUUID } from 'node:crypto';

export type SoulNucleusId = 'N01'|'N02'|'N03'|'N04'|'N05'|'N06';
export type N06MeshRequest = {
  protocol: 'soul-mesh/1';
  id: string;
  correlationId: string;
  source: 'N06';
  target: SoulNucleusId;
  kind: 'request';
  capability: string;
  payload: unknown;
  timestamp: number;
  transport: 'http';
};

export type N06N01BridgeOptions = {
  n01Url?: string;
  meshPath?: string;
  timeoutMs?: number;
  retries?: number;
};

const DEFAULT_PATH = '/mesh/in';
const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_RETRIES = 2;

function normalizeUrl(value: string) {
  return value.replace(/\/+$/, '');
}

function sleep(ms: number) { return new Promise((resolve) => setTimeout(resolve, ms)); }

export class N06N01Bridge {
  private readonly n01Url: string;
  private readonly meshPath: string;
  private readonly timeoutMs: number;
  private readonly retries: number;

  constructor(options: N06N01BridgeOptions = {}) {
    const configured = options.n01Url ?? process.env.SOUL_MESH_N01_URL;
    if (!configured) throw new Error('SOUL_MESH_N01_URL is required for N06 → N01 communication');
    this.n01Url = normalizeUrl(configured);
    this.meshPath = options.meshPath ?? process.env.SOUL_MESH_N01_PATH ?? DEFAULT_PATH;
    this.timeoutMs = options.timeoutMs ?? Number(process.env.SOUL_MESH_TIMEOUT_MS ?? DEFAULT_TIMEOUT);
    this.retries = options.retries ?? Number(process.env.SOUL_MESH_RETRIES ?? DEFAULT_RETRIES);
  }

  endpoint() { return `${this.n01Url}${this.meshPath.startsWith('/') ? this.meshPath : `/${this.meshPath}`}`; }

  private async post(body: unknown, correlationId: string) {
    let lastError: unknown;
    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      const started = Date.now();
      try {
        const response = await fetch(this.endpoint(), {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-soul-nucleus': 'N06',
            'x-soul-target': 'N01',
            'x-correlation-id': correlationId,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        const text = await response.text();
        let payload: unknown = text;
        try { payload = text ? JSON.parse(text) : null; } catch { /* preserve non-JSON response */ }
        if (!response.ok) throw new Error(`N01_HTTP_${response.status}:${typeof payload === 'string' ? payload : JSON.stringify(payload)}`);
        return { payload, status: response.status, latencyMs: Date.now() - started, attempt };
      } catch (error) {
        lastError = error;
        if (attempt < this.retries) await sleep(150 * 2 ** attempt);
      } finally { clearTimeout(timer); }
    }
    throw lastError instanceof Error ? lastError : new Error('N01_REQUEST_FAILED');
  }

  async request(capability: string, payload: unknown, correlationId = randomUUID()) {
    const message: N06MeshRequest = {
      protocol: 'soul-mesh/1', id: randomUUID(), correlationId,
      source: 'N06', target: 'N01', kind: 'request', capability, payload,
      timestamp: Date.now(), transport: 'http',
    };
    return this.post(message, correlationId);
  }

  async register(capabilities: readonly string[], ownership: Record<string, unknown> = {}) {
    return this.request('mesh.register', {
      nucleus: 'N06', endpoint: process.env.SOUL_MESH_N06_URL ?? null,
      protocol: 'soul-mesh/1', capabilities, ownership,
    });
  }

  async heartbeat() {
    return this.request('mesh.heartbeat', { nucleus: 'N06', timestamp: Date.now() });
  }

  async discover() {
    return this.request('mesh.discovery', { nucleus: 'N06' });
  }

  async delegate(capability: string, payload: unknown) {
    return this.request(capability, payload);
  }
}

export function createN06N01Bridge(options?: N06N01BridgeOptions) { return new N06N01Bridge(options); }
