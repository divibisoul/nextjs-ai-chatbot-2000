import type { Session } from 'next-auth';
import type { UIMessageStreamWriter } from 'ai';
import type { ChatMessage } from '@/lib/types';

export interface MeshToolExecutionIdentity {
  userId: string;
  source: string;
  correlationId: string;
}

/**
 * Builds a server-side tool context for authenticated Mesh execution.
 * The Mesh authentication layer must already have verified the envelope/HMAC.
 * A user id is mandatory so document/suggestion tools retain user ownership.
 */
export function createMeshToolSession(identity: MeshToolExecutionIdentity): Session {
  return {
    user: {
      id: identity.userId,
      name: null,
      email: null,
      image: null,
    },
    expires: new Date(Date.now() + 5 * 60_000).toISOString(),
  } as Session;
}

/** Server-side sink: tools may emit UI events without requiring a browser stream. */
export const meshDataStream = {
  write(_message: unknown) {
    return undefined;
  },
} as unknown as UIMessageStreamWriter<ChatMessage>;
