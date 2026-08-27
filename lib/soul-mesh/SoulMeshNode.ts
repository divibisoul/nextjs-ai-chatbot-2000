import type { SoulMeshMessage, SoulMeshTransport, SoulNucleus } from './SoulMeshProtocol';
import { isSoulMeshMessage } from './SoulMeshProtocol';

export class SoulMeshNode {
  constructor(private readonly nucleus: SoulNucleus, private readonly transport: SoulMeshTransport) {}

  onMessage(handler: (message: SoulMeshMessage) => void | Promise<void>): () => void {
    return this.transport.onMessage(async message => {
      if (!isSoulMeshMessage(message)) return;
      if (message.target !== this.nucleus || message.source === this.nucleus) return;
      await handler(message);
    });
  }

  send<T>(target: SoulNucleus, correlationId: string, payload: T, kind: SoulMeshMessage['kind'] = 'event', capability?: string): Promise<void> {
    const message: SoulMeshMessage<T> = { protocol: 'soul-mesh/1', id: crypto.randomUUID(), correlationId, source: this.nucleus, target, kind, capability, payload, timestamp: Date.now() };
    if (!isSoulMeshMessage(message)) return Promise.reject(new Error('INVALID_OUTBOUND_MESH_MESSAGE'));
    return this.transport.send(message);
  }
}
