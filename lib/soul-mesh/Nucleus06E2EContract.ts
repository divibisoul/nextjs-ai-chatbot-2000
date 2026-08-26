import type { SoulMeshMessage, SoulNucleus } from './SoulMeshProtocol';
import { isSoulMeshMessage } from './SoulMeshProtocol';

export const NUCLEUS_06: SoulNucleus = 'N06';
export const NUCLEUS_06_PROTOCOL = 'soul-mesh/1' as const;
export const NUCLEUS_06_PEER_COUNT = 5;
export const NUCLEUS_06_ROUTE_COUNT = 10;

export function createNucleus06Request(target: SoulNucleus, capability: string, payload: unknown): SoulMeshMessage {
  return {
    protocol: NUCLEUS_06_PROTOCOL,
    id: crypto.randomUUID(),
    correlationId: crypto.randomUUID(),
    source: NUCLEUS_06,
    target,
    kind: 'request',
    capability,
    payload,
    timestamp: Date.now(),
  };
}

export function validateNucleus06Response(request: SoulMeshMessage, response: unknown): response is SoulMeshMessage {
  if (!isSoulMeshMessage(response)) return false;
  return response.protocol === request.protocol
    && response.correlationId === request.correlationId
    && response.source === request.target
    && response.target === request.source
    && (response.kind === 'response' || response.kind === 'error');
}

/** Compatibility aliases only; no duplicate contract implementation. */
export const NUCLEUS_05 = NUCLEUS_06;
export const NUCLEUS_05_PROTOCOL = NUCLEUS_06_PROTOCOL;
export const NUCLEUS_05_PEER_COUNT = NUCLEUS_06_PEER_COUNT;
export const NUCLEUS_05_ROUTE_COUNT = NUCLEUS_06_ROUTE_COUNT;
export const createNucleus05Request = createNucleus06Request;
export const validateNucleus05Response = validateNucleus06Response;
