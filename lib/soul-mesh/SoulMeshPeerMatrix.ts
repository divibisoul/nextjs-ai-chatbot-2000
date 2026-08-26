import { SOUL_MESH_PEERS, type SoulNucleusId } from './SoulMeshTopology';

export const NUCLEUS_ID: SoulNucleusId = 'N05';
export type SoulMeshDirection = 'in' | 'out';
export type SoulMeshPeerRoute = { peer: SoulNucleusId; direction: SoulMeshDirection; enabled: boolean; slot: 1 | 2 | 3 | 4 | 5 };

/** N05 exposes five logical peers and one IN + one OUT port for each. */
export const R5_PEER_ROUTES: SoulMeshPeerRoute[] = SOUL_MESH_PEERS[NUCLEUS_ID].flatMap((peer, index) => [
  { peer, direction: 'in' as const, enabled: true, slot: (index + 1) as SoulMeshPeerRoute['slot'] },
  { peer, direction: 'out' as const, enabled: true, slot: (index + 1) as SoulMeshPeerRoute['slot'] },
]);

export function peerRoutes(peer: SoulNucleusId): SoulMeshPeerRoute[] {
  return R5_PEER_ROUTES.filter((route) => route.peer === peer);
}
