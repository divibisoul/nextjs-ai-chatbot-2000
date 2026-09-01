import {
  SOUL_MESH_PROTOCOL,
  SOUL_MESH_CONTRACT_VERSION,
  type SoulMeshMessage as CanonicalSoulMeshMessage,
  validateSoulMeshMessage,
} from '@/lib/soul-mesh/SoulMeshProtocol';
import { handleMeshMessage as canonicalHandleMeshMessage } from '@/lib/soul-mesh/endpoint';

export { SOUL_MESH_PROTOCOL, SOUL_MESH_CONTRACT_VERSION };
export type NucleusId = 'N01'|'N02'|'N03'|'N04'|'N05'|'N06';
export type SoulMeshMessage<T = unknown> = CanonicalSoulMeshMessage<T>;

export function validateMessage(message: SoulMeshMessage, nucleusId: NucleusId): true {
  if (message.target !== nucleusId) throw new Error('Invalid Mesh message');
  validateSoulMeshMessage(message);
  return true;
}

/** Compatibility facade. The canonical N06 handler remains the only executing implementation. */
export async function handleMeshMessage(
  message: SoulMeshMessage,
  nucleusId: NucleusId,
  handlers: Record<string, (payload: unknown) => Promise<unknown> | unknown> = {},
): Promise<SoulMeshMessage> {
  validateMessage(message, nucleusId);
  return canonicalHandleMeshMessage(message, handlers);
}
