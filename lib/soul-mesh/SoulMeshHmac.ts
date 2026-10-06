import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { SoulMeshMessage } from './SoulMeshProtocol';

const MAX_CLOCK_SKEW_MS = 30_000;

function canonicalize(message: SoulMeshMessage, nonce: string): string {
  return JSON.stringify({
    protocol: message.protocol,
    contractVersion: message.contractVersion,
    id: message.id,
    correlationId: message.correlationId,
    source: message.source,
    target: message.target,
    kind: message.kind,
    capability: message.capability ?? null,
    payload: message.payload,
    timestamp: message.timestamp,
    meta: message.meta ?? null,
    nonce,
  });
}

export function createSoulMeshNonce(): string {
  return randomBytes(24).toString('base64url');
}

export function signSoulMeshMessage(
  message: SoulMeshMessage,
  secret: string,
  nonce: string,
): string {
  if (!secret) throw new Error('SOUL_MESH_HMAC_SECRET_MISSING');
  return createHmac('sha256', secret)
    .update(canonicalize(message, nonce), 'utf8')
    .digest('hex');
}

export function verifySoulMeshMessage(
  message: SoulMeshMessage,
  secret: string,
  nonce: string,
  hmac: string,
  now = Date.now(),
): boolean {
  if (!secret || !nonce || !hmac || !Number.isFinite(message.timestamp)) return false;
  if (Math.abs(now - message.timestamp) > MAX_CLOCK_SKEW_MS) return false;
  try {
    const expected = signSoulMeshMessage(message, secret, nonce);
    if (!/^[0-9a-f]{64}$/i.test(hmac)) return false;
    const actual = Buffer.from(hmac, 'hex');
    const wanted = Buffer.from(expected, 'hex');
    return actual.length === wanted.length && timingSafeEqual(actual, wanted);
  } catch {
    return false;
  }
}

export function signSoulMeshResponse(
  request: SoulMeshMessage,
  payload: unknown,
  kind: 'response' | 'error',
  secret: string,
): { message: SoulMeshMessage; nonce: string; hmac: string } {
  if (!secret) throw new Error('SOUL_MESH_HMAC_SECRET_MISSING');
  const nonce = createSoulMeshNonce();
  const message: SoulMeshMessage = {
    protocol: 'soul-mesh/1',
    contractVersion: '1.1.0',
    id: crypto.randomUUID(),
    correlationId: request.correlationId,
    source: request.target,
    target: request.source,
    kind,
    capability: request.capability,
    payload,
    timestamp: Date.now(),
    transport: request.transport ?? 'HTTP',
    nonce,
    meta: {
      ...(request.meta ?? {}),
      runtime: 'nextjs-ai-chatbot-2000',
      transport: request.transport ?? 'HTTP',
      encoding: request.meta?.encoding ?? 'json',
      version: '1.1.0',
      nonce,
      traceId: request.meta?.traceId ?? request.correlationId,
    },
  };
  const hmac = signSoulMeshMessage(message, secret, nonce);
  return { message, nonce, hmac };
}

export function verifySoulMeshResponse(
  request: SoulMeshMessage,
  response: SoulMeshMessage,
  secret: string,
  now = Date.now(),
): boolean {
  const nonce = String(response.nonce ?? response.meta?.nonce ?? '').trim();
  const hmac = String(response.hmac ?? '').trim();
  if (!nonce || !hmac) return false;
  if (response.source !== request.target || response.target !== request.source) return false;
  if (response.correlationId !== request.correlationId) return false;
  if (response.kind !== 'response' && response.kind !== 'error') return false;
  return verifySoulMeshMessage(response, secret, nonce, hmac, now);
}
