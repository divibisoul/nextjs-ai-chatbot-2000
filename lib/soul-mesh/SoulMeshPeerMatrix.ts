import type { SoulNucleus } from './SoulMeshProtocol';

/**
 * Legacy/all topology is preserved. Executable routing is explicitly narrowed
 * to N01-N05, while N07 is retained only as the final structural stage.
 */
export const SOUL_MESH_PEERS: readonly SoulNucleus[] = ['N01', 'N02', 'N03', 'N04', 'N05', 'N07'];
export const SOUL_MESH_ACTIVE_PEERS: readonly SoulNucleus[] = ['N01', 'N02', 'N03', 'N04', 'N05'];
export const SOUL_MESH_STRUCTURAL_PEERS: readonly SoulNucleus[] = ['N07'];
export type SoulMeshPeer = (typeof SOUL_MESH_PEERS)[number];
export type SoulMeshActivePeer = (typeof SOUL_MESH_ACTIVE_PEERS)[number];
export type SoulMeshStructuralPeer = (typeof SOUL_MESH_STRUCTURAL_PEERS)[number];
export type SoulMeshDirection = 'in' | 'out';
export type SoulMeshPeerExecutionMode = 'active' | 'structural-only';
export type SoulMeshPeerRoute = {
  peer: SoulMeshPeer;
  direction: SoulMeshDirection;
  enabled: boolean;
  execution: SoulMeshPeerExecutionMode;
  url: string;
  inboundPath: string;
  healthPath: string;
};

const envUrl = (peer: SoulMeshPeer) => (process.env[`SOUL_MESH_${peer}_URL`] ?? '').replace(/\/$/, '');

export const R6_PEER_ROUTES: SoulMeshPeerRoute[] = SOUL_MESH_ACTIVE_PEERS.flatMap((peer) => [
  { peer, direction: 'in' as const, enabled: true, execution: 'active' as const, url: envUrl(peer), inboundPath: '/api/soul-mesh', healthPath: '/api/soul-mesh' },
  { peer, direction: 'out' as const, enabled: true, execution: 'active' as const, url: envUrl(peer), inboundPath: '/api/soul-mesh', healthPath: '/api/soul-mesh' },
]);

export const R7_PEER_ROUTES: SoulMeshPeerRoute[] = SOUL_MESH_STRUCTURAL_PEERS.flatMap((peer) => [
  { peer, direction: 'in' as const, enabled: false, execution: 'structural-only' as const, url: envUrl(peer), inboundPath: '/api/soul-mesh', healthPath: '/api/soul-mesh' },
  { peer, direction: 'out' as const, enabled: false, execution: 'structural-only' as const, url: envUrl(peer), inboundPath: '/api/soul-mesh', healthPath: '/api/soul-mesh' },
]);

/** Backwards-compatible active routing inventory. */
export const R5_PEER_ROUTES = R6_PEER_ROUTES;

export function peerRoutes(peer: SoulMeshPeer): SoulMeshPeerRoute[] {
  return [...R6_PEER_ROUTES, ...R7_PEER_ROUTES].filter((route) => route.peer === peer);
}
export function hasPeer(peer: string): peer is SoulMeshPeer {
  return (SOUL_MESH_PEERS as readonly string[]).includes(peer);
}
export function configuredPeers(): SoulMeshPeerRoute[] {
  return R6_PEER_ROUTES.filter((route) => route.direction === 'out' && Boolean(route.url));
}
