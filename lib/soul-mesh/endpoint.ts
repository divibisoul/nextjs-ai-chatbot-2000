import { N06_CAPABILITIES, supportsN06Capability } from './N06Capabilities';
import { isSoulMeshMessage, type SoulMeshMessage } from './SoulMeshProtocol';

export const NUCLEUS_ID = 'N06' as const;
const MAX_CLOCK_SKEW_MS = Number(process.env.SOUL_MESH_MAX_CLOCK_SKEW_MS || 300_000);

export function validateMeshMessage(message: unknown): asserts message is SoulMeshMessage {
  if (!isSoulMeshMessage(message)) throw new Error('INVALID_SOUL_MESH_MESSAGE');
  if (message.target !== NUCLEUS_ID) throw new Error('WRONG_TARGET');
  if (message.kind === 'request' && !message.capability) throw new Error('MISSING_CAPABILITY');
  if (Math.abs(Date.now() - message.timestamp) > MAX_CLOCK_SKEW_MS) throw new Error('MESSAGE_TIMESTAMP_OUT_OF_RANGE');
}

export async function handleMeshMessage(
  message: SoulMeshMessage,
  handlers: Record<string, (payload: unknown) => Promise<unknown> | unknown>,
) {
  validateMeshMessage(message);
  if (message.kind !== 'request') return message;

  const capability = message.capability!;
  if (!supportsN06Capability(capability)) {
    return {
      ...message,
      kind: 'error' as const,
      payload: {
        code: 'CAPABILITY_NOT_FOUND',
        nucleus: NUCLEUS_ID,
        capability,
        availableCapabilities: [...N06_CAPABILITIES],
      },
    };
  }

  const handler = handlers[capability];
  if (!handler) {
    return {
      ...message,
      kind: 'error' as const,
      payload: { code: 'CAPABILITY_HANDLER_NOT_REGISTERED', nucleus: NUCLEUS_ID, capability },
    };
  }

  try {
    return {
      ...message,
      kind: 'response' as const,
      payload: await handler(message.payload),
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      ...message,
      kind: 'error' as const,
      payload: {
        code: 'CAPABILITY_EXECUTION_ERROR',
        nucleus: NUCLEUS_ID,
        capability,
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: Date.now(),
    };
  }
}
