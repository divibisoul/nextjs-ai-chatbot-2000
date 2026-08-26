import type { SoulNucleus } from './SoulMeshProtocol';
import { NUCLEUS_05_CAPABILITIES } from '../soul-core/Nucleus05Capabilities';
import { SOUL_MESH_PEERS } from './SoulMeshTransportContract';

/** Canonical N06 declaration used by discovery/orchestration layers. */
export const N06_INTEROP_MANIFEST = {
  nucleus: 'N06' as SoulNucleus,
  protocol: 'soul-mesh/1' as const,
  peers: SOUL_MESH_PEERS.filter((peer) => peer !== 'N06'),
  inbound: true,
  outbound: true,
  localCapabilities: [...NUCLEUS_05_CAPABILITIES],
  transportPolicy: 'provider-agnostic',
  executionPolicy: 'local-runtime-or-explicit-remote-delegation',
  routeCount: 10,
};
