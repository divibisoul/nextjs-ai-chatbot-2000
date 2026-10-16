import { sendFromN06, type N06Peer } from './N06PeerAdapter';

export type N06CooperationHandshake = {
  target: N06Peer;
  requiredCapability?: string;
  correlationId?: string;
};

export type N06CooperationExchange = {
  target: N06Peer;
  capability: string;
  payload?: unknown;
  correlationId?: string;
};

/**
 * N06 participates in the canonical cooperative control plane through N07.
 * No second transport is created: N07 performs discovery, negotiation and route
 * observation on the existing Soul Mesh.
 */
export async function requestN07CooperationHandshake(
  request: N06CooperationHandshake,
): Promise<unknown> {
  const target = request.target?.trim() as N06Peer;
  if (!target) throw new Error('N06_COOPERATION_TARGET_REQUIRED');

  return sendFromN06(
    'N07',
    'cooperation.handshake',
    {
      target,
      required_capability: request.requiredCapability?.trim() || '',
    },
    15000,
    request.correlationId,
    request.correlationId,
  );
}

export async function requestN07CooperationExchange(
  request: N06CooperationExchange,
): Promise<unknown> {
  const target = request.target?.trim() as N06Peer;
  const capability = request.capability?.trim();
  if (!target) throw new Error('N06_COOPERATION_TARGET_REQUIRED');
  if (!capability) throw new Error('N06_COOPERATION_CAPABILITY_REQUIRED');

  return sendFromN06(
    'N07',
    'cooperation.exchange',
    {
      target,
      capability,
      payload: request.payload ?? {},
    },
    15000,
    request.correlationId,
    request.correlationId,
  );
}
