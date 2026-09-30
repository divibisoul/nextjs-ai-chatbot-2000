import type { SoulMeshMessage, SoulNucleus } from './SoulMeshProtocol';
import { isSoulMeshMessage } from './SoulMeshProtocol';

export const N01_N06_CAPABILITIES = [
  'mesh.handshake',
  'mesh.describe',
  'ai.reasoning',
  'conversation',
  'tools.describe',
  'context.orchestration',
] as const;

export type N01N06Capability = typeof N01_N06_CAPABILITIES[number];

export function createN01ToN06Request(capability: N01N06Capability, payload: unknown): SoulMeshMessage {
  return {
    protocol: 'soul-mesh/1',
    id: crypto.randomUUID(),
    correlationId: crypto.randomUUID(),
    source: 'N01',
    target: 'N06',
    kind: 'request',
    capability,
    payload,
    timestamp: Date.now(),
  };
}

export function validateN06ToN01Response(request: SoulMeshMessage, response: unknown): response is SoulMeshMessage {
  if (!isSoulMeshMessage(response)) return false;
  return response.correlationId === request.correlationId
    && response.source === 'N06'
    && response.target === 'N01'
    && (response.kind === 'response' || response.kind === 'error');
}

export function isN01N06Pair(source: SoulNucleus, target: SoulNucleus) {
  return (source === 'N01' && target === 'N06') || (source === 'N06' && target === 'N01');
}
