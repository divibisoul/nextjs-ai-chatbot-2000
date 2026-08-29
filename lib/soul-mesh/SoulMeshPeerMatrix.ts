import type { SoulNucleus } from './SoulMeshProtocol';

/** Canonical N06 peer set. Repository names are transport/deployment metadata, never protocol identities. */
export const SOUL_MESH_PEERS: readonly SoulNucleus[] = ['N01', 'N02', 'N03', 'N04', 'N05'];
export type SoulMeshPeer = (typeof SOUL_MESH_PEERS)[number];
export type SoulMeshDirection = 'in' | 'out';
export type SoulMeshPeerRoute = { peer: SoulMeshPeer; direction: SoulMeshDirection; enabled: boolean; url: string; inboundPath: string; healthPath: string };

const envUrl = (peer: SoulMeshPeer) => (process.env[`SOUL_MESH_${peer}_URL`] ?? '').replace(/\/$/, '');

export const R6_PEER_ROUTES: SoulMeshPeerRoute[] = SOUL_MESH_PEERS.flatMap((peer) => [
  { peer, direction: 'in' as const, enabled: true, url: envUrl(peer), inboundPath: '/mesh/in', healthPath: '/mesh/health' },
  { peer, direction: 'out' as const, enabled: true, url: envUrl(peer), inboundPath: '/mesh/in', healthPath: '/mesh/health' },
]);

export const R5_PEER_ROUTES = R6_PEER_ROUTES;

export function peerRoutes(peer: SoulMeshPeer): SoulMeshPeerRoute[] { return R6_PEER_ROUTES.filter((route) => route.peer === peer); }
export function hasPeer(peer: string): peer is SoulMeshPeer { return (SOUL_MESH_PEERS as readonly string[]).includes(peer); }
export function configuredPeers(): SoulMeshPeerRoute[] { return R6_PEER_ROUTES.filter((route) => route.direction === 'out' && Boolean(route.url)); }
