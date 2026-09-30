import { isSoulMeshMessage, type SoulMeshMessage, type SoulNucleus } from './SoulMeshProtocol';

export interface N06PeerClientOptions {
  endpoint: string;
  token?: string;
  timeoutMs?: number;
  retries?: number;
}

/** Transport-neutral outbound RPC from N06. The peer URL is configuration, never inferred. */
export class N06PeerClient {
  constructor(private readonly options: N06PeerClientOptions) {}

  async request<T>(target: SoulNucleus, capability: string, payload: unknown): Promise<SoulMeshMessage<T>> {
    const request: SoulMeshMessage = {
      protocol: 'soul-mesh/1',
      id: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
      source: 'N06',
      target,
      kind: 'request',
      capability,
      payload,
      timestamp: Date.now(),
    };
    const retries = Math.max(0, this.options.retries ?? 1);
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 15000);
      try {
        const response = await fetch(this.options.endpoint, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            ...(this.options.token ? { authorization: `Bearer ${this.options.token}` } : {}),
          },
          body: JSON.stringify(request),
          signal: controller.signal,
        });
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(`SOUL_MESH_HTTP_${response.status}`);
        if (!isSoulMeshMessage(body)) throw new Error('INVALID_SOUL_MESH_RESPONSE');
        if (body.correlationId !== request.correlationId || body.source !== target || body.target !== 'N06') {
          throw new Error('CORRELATION_OR_ROUTE_MISMATCH');
        }
        return body as SoulMeshMessage<T>;
      } catch (error) {
        lastError = error;
        if (attempt === retries) break;
        await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)));
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastError instanceof Error ? lastError : new Error('SOUL_MESH_REQUEST_FAILED');
  }
}
