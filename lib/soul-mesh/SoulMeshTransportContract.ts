import type { SoulMeshMessage, SoulNucleus } from './SoulMeshProtocol';

/** Provider/API-agnostic transport boundary for Soul nucleus communication. */
export interface SoulMeshPeerTransport {
  readonly localNucleus: SoulNucleus;
  send(message: SoulMeshMessage): Promise<void>;
  onMessage(handler: (message: SoulMeshMessage) => void | Promise<void>): () => void;
}

export interface SoulMeshPeerDescriptor {
  nucleus: SoulNucleus;
  protocol: 'soul-mesh/1';
  inbound: boolean;
  outbound: boolean;
  capabilities: string[];
  transports: string[];
}

export const SOUL_MESH_PEERS: SoulNucleus[] = ['N01','N02','N03','N04','N05','N06'];
export const N06_REMOTE_PEERS = SOUL_MESH_PEERS.filter((peer) => peer !== 'N06');
