import { executeN06Capability, getN06Capabilities } from './N06CapabilityDispatcher';
import {
  SOUL_MESH_PROTOCOL,
  SOUL_MESH_CONTRACT_VERSION,
  type SoulMeshMessage,
  type SoulNucleus,
  validateSoulMeshMessage,
} from './SoulMeshProtocol';

export const NUCLEUS_ID = 'N06' as const;
export { SOUL_MESH_PROTOCOL, SOUL_MESH_CONTRACT_VERSION };
export type NucleusId = SoulNucleus;

export function validateMeshMessage(message: SoulMeshMessage, nucleusId: NucleusId = NUCLEUS_ID): true {
  validateSoulMeshMessage(message);
  if (message.target !== nucleusId) throw new Error('WRONG_TARGET');
  return true;
}

export function getN06MeshCapabilities() { return getN06Capabilities(); }

function response(message: SoulMeshMessage, kind: 'response' | 'error', payload: unknown): SoulMeshMessage {
  return {
    protocol: SOUL_MESH_PROTOCOL,
    contractVersion: SOUL_MESH_CONTRACT_VERSION,
    id: crypto.randomUUID(),
    correlationId: message.correlationId,
    source: NUCLEUS_ID,
    target: message.source,
    kind,
    capability: message.capability,
    payload,
    timestamp: Date.now(),
    transport: message.transport,
    meta: { ...(message.meta ?? {}), version: SOUL_MESH_CONTRACT_VERSION, traceId: message.meta?.traceId ?? message.correlationId },
  };
}

export async function handleMeshMessage(
  message: SoulMeshMessage,
  handlers: Record<string, (payload: unknown) => Promise<unknown> | unknown> = {},
): Promise<SoulMeshMessage> {
  validateMeshMessage(message);
  if (message.kind !== 'request') return message;
  const capability = message.capability;
  if (!capability) throw new Error('CAPABILITY_REQUIRED');
  try {
    const result = handlers[capability] ? await handlers[capability](message.payload) : await executeN06Capability(capability, message.payload);
    return response(message, 'response', result);
  } catch (error) {
    return response(message, 'error', { code: 'CAPABILITY_EXECUTION_ERROR', capability, detail: error instanceof Error ? error.message : 'Unknown error' });
  }
}
