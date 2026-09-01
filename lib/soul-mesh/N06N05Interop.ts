import { randomUUID } from 'crypto';
import type { SoulMeshMessage } from './SoulMeshProtocol';

/** Executable N06 ↔ N05 handoff contract. Transport remains replaceable; identity/correlation is not. */
export const N06_N05_INTEROP = {
  local: 'N06', peer: 'N05', protocol: 'soul-mesh/1', contractVersion: '1.1.0',
  directions: ['N06.OUT.N05', 'N06.IN.N05'] as const,
  peerCount: 1, routeCount: 2,
  capabilities: ['ai-pilot','tool-execution','artifact-processing','document-processing','context-orchestration','streaming','mesh-communication'] as const,
  transports: ['LOOPBACK_HTTP','HTTP','REALTIME'] as const,
} as const;

export function createN06ToN05Request(capability: string, payload: unknown, correlationId = randomUUID()): SoulMeshMessage {
  const id = randomUUID();
  const message: SoulMeshMessage = {
    protocol: 'soul-mesh/1', contractVersion: '1.1.0', id, correlationId,
    source:'N06', target:'N05', kind:'request', capability, payload, timestamp:Date.now(),
    transport:'HTTP', meta:{runtime:'nextjs-ai-chatbot-2000',transport:'HTTP',encoding:'json',version:'1.1.0',nonce:randomUUID(),traceId:correlationId},
  };
  if (!capability.trim()) throw new Error('N06_N05_CAPABILITY_REQUIRED');
  return message;
}

export function validateN05Response(request: SoulMeshMessage, response: unknown): response is SoulMeshMessage {
  if (!response || typeof response !== 'object') return false;
  const value = response as SoulMeshMessage;
  return value.protocol === request.protocol && value.contractVersion === request.contractVersion && value.correlationId === request.correlationId && value.source === 'N05' && value.target === 'N06' && (value.kind === 'response' || value.kind === 'error');
}
