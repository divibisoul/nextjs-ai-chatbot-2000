import type { SoulMeshTransportKind } from './SoulMeshProtocol';

export const N06_PEERS = ['N01', 'N02', 'N03', 'N04', 'N05'] as const;
export type N06Peer = (typeof N06_PEERS)[number];

export const N06_IN_CHANNELS = N06_PEERS.map((peer) => `N06.IN.${peer}`) as readonly string[];
export const N06_OUT_CHANNELS = N06_PEERS.map((peer) => `N06.OUT.${peer}`) as readonly string[];
export const N06_CHANNELS = [...N06_IN_CHANNELS, ...N06_OUT_CHANNELS] as readonly string[];

export const N06_TRANSPORTS: readonly SoulMeshTransportKind[] = [
  'IN_PROCESS',
  'WEBVIEW_BRIDGE',
  'LOOPBACK_HTTP',
  'HTTP',
  'REALTIME',
];

export type N06Channel = {
  peer: N06Peer;
  inbound: string;
  outbound: string;
  transports: readonly SoulMeshTransportKind[];
};

export const N06_CHANNEL_MATRIX: readonly N06Channel[] = N06_PEERS.map((peer) => ({
  peer,
  inbound: `N06.IN.${peer}`,
  outbound: `N06.OUT.${peer}`,
  transports: N06_TRANSPORTS,
}));

export function isN06Peer(value: string): value is N06Peer {
  return (N06_PEERS as readonly string[]).includes(value);
}

export function channelFor(peer: N06Peer, direction: 'IN' | 'OUT'): string {
  return `N06.${direction}.${peer}`;
}

export function channelsFor(peer: N06Peer): { inbound: string; outbound: string } {
  return { inbound: channelFor(peer, 'IN'), outbound: channelFor(peer, 'OUT') };
}
