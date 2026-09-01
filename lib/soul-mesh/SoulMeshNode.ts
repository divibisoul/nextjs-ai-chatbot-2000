import { randomUUID } from 'node:crypto';
import type { SoulMeshMessage, SoulMeshTransport, SoulNucleus } from './SoulMeshProtocol';
import { isSoulMeshMessage } from './SoulMeshProtocol';

export class SoulMeshNode {
  constructor(private readonly nucleus: SoulNucleus, private readonly transport: SoulMeshTransport) {}
  onMessage(handler: (message: SoulMeshMessage) => void | Promise<void>): () => void { return this.transport.onMessage(async message => { if (!isSoulMeshMessage(message)) return; if (message.target !== this.nucleus || message.source === this.nucleus) return; await handler(message); }); }
  send<T>(target: SoulNucleus, correlationId: string, payload: T, kind: SoulMeshMessage['kind'] = 'event', capability?: string): Promise<void> {
    const message: SoulMeshMessage<T> = { protocol: 'soul-mesh/1', contractVersion: '1.1.0', id: randomUUID(), correlationId, source: this.nucleus, target, kind, capability: capability ?? (kind === 'event' ? 'mesh.event' : undefined), payload, timestamp: Date.now(), meta: { runtime: 'nextjs-ai-chatbot-2000', transport: 'HTTP', encoding: 'json', version: '1.1.0', traceId: correlationId, nonce: randomUUID() } };
    if (!isSoulMeshMessage(message)) return Promise.reject(new Error('INVALID_OUTBOUND_MESH_MESSAGE'));
    return this.transport.send(message);
  }
}
