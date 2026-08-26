import type { SoulMeshMessage } from './SoulMeshProtocol';

/** Canonical N06 ↔ N05 interoperability facts derived from the existing Mesh contracts. */
export const N06_N05_INTEROP = {
  local: 'N06', peer: 'N05', protocol: 'soul-mesh/1',
  directions: ['N06.OUT.N05', 'N06.IN.N05'] as const,
  peerCount: 1, routeCount: 2,
  capabilities: ['ai-pilot','tool-execution','artifact-processing','document-processing','context-orchestration','streaming','mesh-communication'] as const,
};

export function createN06ToN05Request(capability: string, payload: unknown): SoulMeshMessage {
  const correlationId = crypto.randomUUID();
  return { protocol:'soul-mesh/1', id:crypto.randomUUID(), correlationId, source:'N06', target:'N05', kind:'request', capability, payload, timestamp:Date.now() };
}

export function validateN05Response(request: SoulMeshMessage, response: unknown): response is SoulMeshMessage {
  if (!response || typeof response !== 'object') return false;
  const value = response as SoulMeshMessage;
  return value.protocol === request.protocol && value.correlationId === request.correlationId && value.source === 'N05' && value.target === 'N06' && (value.kind === 'response' || value.kind === 'error');
}
