import type { SoulMeshMessage, SoulMeshTransport } from './SoulMeshProtocol';

export interface SoulMeshHttpTransportOptions {
  timeoutMs?: number;
  maxAttempts?: number;
  retryBaseMs?: number;
}

/** HTTP transport with bounded timeout/retry. Retries are disabled for non-idempotent requests. */
export class SoulMeshHttpTransport implements SoulMeshTransport {
  private listeners = new Set<(message: SoulMeshMessage) => void | Promise<void>>();
  private readonly timeoutMs: number;
  private readonly maxAttempts: number;
  private readonly retryBaseMs: number;

  constructor(
    private readonly endpoint: string,
    private readonly headers: Record<string, string> = {},
    options: SoulMeshHttpTransportOptions = {},
  ) {
    this.timeoutMs = Math.max(100, options.timeoutMs ?? 15_000);
    this.maxAttempts = Math.max(1, options.maxAttempts ?? 3);
    this.retryBaseMs = Math.max(0, options.retryBaseMs ?? 250);
  }

  async send(message: SoulMeshMessage): Promise<void> {
    const retryable = message.kind === 'event';
    const attempts = retryable ? this.maxAttempts : 1;
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json', ...this.headers },
          body: JSON.stringify(message),
          signal: controller.signal,
        });
        if (response.ok) return;
        if (response.status < 500 || attempt === attempts) {
          throw new Error(`Soul Mesh transport failed: HTTP ${response.status}`);
        }
        lastError = new Error(`Soul Mesh transport failed: HTTP ${response.status}`);
      } catch (error) {
        lastError = error;
        if (attempt === attempts) break;
      } finally {
        clearTimeout(timer);
      }
      await new Promise(resolve => setTimeout(resolve, this.retryBaseMs * 2 ** (attempt - 1)));
    }

    throw lastError instanceof Error ? lastError : new Error('Soul Mesh transport failed');
  }

  onMessage(handler: (message: SoulMeshMessage) => void | Promise<void>): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  async receive(message: SoulMeshMessage): Promise<void> {
    await Promise.allSettled([...this.listeners].map(listener => listener(message)));
  }
}
