import type { SoulMeshMessage, SoulMeshTransport } from './SoulMeshProtocol';

/** Keeps N06 transport-agnostic: every configured transport may participate in the mesh. */
export class SoulMeshTransportMultiplexer implements SoulMeshTransport {
  constructor(private readonly transports: SoulMeshTransport[]) {}

  async send(message: SoulMeshMessage) {
    const failures: unknown[] = [];
    for (const transport of this.transports) {
      try {
        await transport.send(message);
        return;
      } catch (error) {
        failures.push(error);
      }
    }
    throw new AggregateError(failures, 'All Soul Mesh transports failed');
  }

  onMessage(handler: (message: SoulMeshMessage) => void | Promise<void>) {
    const unsubscribe = this.transports.map(transport => transport.onMessage(handler));
    return () => unsubscribe.forEach(stop => stop());
  }
}
