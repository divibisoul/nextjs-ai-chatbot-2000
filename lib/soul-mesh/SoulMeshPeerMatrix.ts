export const SOUL_MESH_PEERS = ['aeternum','nexus','eternium','chatbot','chatbots'] as const;
export type SoulMeshPeer = typeof SOUL_MESH_PEERS[number];
export type SoulMeshDirection = 'in' | 'out';
export type SoulMeshPeerRoute = { peer: SoulMeshPeer; direction: SoulMeshDirection; enabled: boolean };
export const R6_PEER_ROUTES: SoulMeshPeerRoute[] = SOUL_MESH_PEERS.flatMap((peer) => [
  { peer, direction: 'in' as const, enabled: true },
  { peer, direction: 'out' as const, enabled: true },
]);
export function peerRoutes(peer: SoulMeshPeer): SoulMeshPeerRoute[] { return R6_PEER_ROUTES.filter((route) => route.peer === peer); }
