import type { SoulMeshMessage, SoulNucleus } from './SoulMeshProtocol';
import { isSoulMeshMessage } from './SoulMeshProtocol';

export const NUCLEUS_05 = 'N05' as const satisfies SoulNucleus;
export const NUCLEUS_05_PROTOCOL = 'soul-mesh/1' as const;
export const NUCLEUS_05_PEER_COUNT = 5;
export const NUCLEUS_05_ROUTE_COUNT = 10;

export function createNucleus05Request(target: SoulNucleus, capability: string, payload: unknown): SoulMeshMessage {
  const correlationId = crypto.randomUUID();
  return { protocol: NUCLEUS_05_PROTOCOL, id: crypto.randomUUID(), correlationId, source: NUCLEUS_05, target, kind: 'request', capability, payload, timestamp: Date.now() };
}

export function validateNucleus05Response(request: SoulMeshMessage, response: unknown): response is SoulMeshMessage {
  if (!isSoulMeshMessage(response)) return false;
  return response.protocol === request.protocol && response.correlationId === request.correlationId && response.source === request.target && response.target === request.source && (response.kind === 'response' || response.kind === 'error');
}
