import type { SoulMeshMessage } from './SoulMeshProtocol';
import { randomUUID } from 'node:crypto';
import { createSoulMeshNonce, signSoulMeshMessage, verifySoulMeshResponse } from './SoulMeshHmac';

export const NUCLEUS_ID = 'N06' as const;
const PEERS = ('N01 N02 N03 N04 N05 N07').split(' ') as Array<'N01' | 'N02' | 'N03' | 'N04' | 'N05' | 'N07'>;
const urls: Partial<Record<string, string>> = {
  N01: process.env.SOUL_MESH_N01_URL,
  N02: process.env.SOUL_MESH_N02_URL,
  N03: process.env.SOUL_MESH_N03_URL,
  N04: process.env.SOUL_MESH_N04_URL,
  N05: process.env.SOUL_MESH_N05_URL,
  N07: process.env.SOUL_MESH_N07_URL,
};

function signedHeaders(message: SoulMeshMessage): Record<string, string> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    accept: 'application/json',
    'x-soul-correlation-id': message.correlationId,
  };
  const secret = process.env.SOUL_MESH_HMAC_SECRET?.trim();
  const token = process.env.SOUL_MESH_TOKEN?.trim();
  if (process.env.NODE_ENV === 'production' && !secret) {
    throw new Error(`SOUL_MESH_HMAC_NOT_CONFIGURED:${message.target}`);
  }
  if (secret && Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('SOUL_MESH_HMAC_SECRET_TOO_SHORT');
  }
  if (token) headers.authorization = `Bearer ${token}`;
  if (secret) {
    const nonce = createSoulMeshNonce();
    message.nonce = nonce;
    message.meta = { ...(message.meta ?? {}), nonce };
    headers['x-soul-mesh-nonce'] = nonce;
    headers['x-soul-mesh-hmac'] = signSoulMeshMessage(message, secret, nonce);
  }
  return headers;
}

export async function sendTo(
  target: SoulMeshMessage['target'],
  capability: string,
  payload: unknown,
  timeoutMs = 15000,
): Promise<SoulMeshMessage> {
  const url = urls[target];
  if (!url) throw new Error(`SOUL_MESH_PEER_URL_NOT_CONFIGURED:${target}`);
  if (!capability.trim()) throw new Error('SOUL_MESH_CAPABILITY_REQUIRED');
  const secret = process.env.SOUL_MESH_HMAC_SECRET?.trim();
  if (process.env.NODE_ENV === 'production' && !secret) {
    throw new Error(`SOUL_MESH_HMAC_NOT_CONFIGURED:${target}`);
  }
  if (secret && Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('SOUL_MESH_HMAC_SECRET_TOO_SHORT');
  }

  const correlationId = randomUUID();
  const message: SoulMeshMessage = {
    protocol: 'soul-mesh/1',
    contractVersion: '1.1.0',
    id: randomUUID(),
    correlationId,
    source: NUCLEUS_ID,
    target,
    kind: 'request',
    capability,
    payload,
    timestamp: Date.now(),
    transport: 'HTTP',
    meta: {
      runtime: 'nextjs-ai-chatbot-2000',
      transport: 'HTTP',
      encoding: 'json',
      version: '1.1.1',
      traceId: correlationId,
    },
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: signedHeaders(message),
      body: JSON.stringify(message),
      signal: controller.signal,
    });
    const raw: unknown = await response.json().catch(() => null);
    if (!raw || typeof raw !== 'object') throw new Error('SOUL_MESH_INVALID_RESPONSE_BODY');
    const body = raw as SoulMeshMessage;
    if (
      body.protocol !== message.protocol
      || body.contractVersion !== message.contractVersion
      || typeof body.id !== 'string'
      || !body.id.trim()
      || body.correlationId !== correlationId
      || body.source !== target
      || body.target !== NUCLEUS_ID
      || body.capability !== capability
      || (body.kind !== 'response' && body.kind !== 'error')
      || !Number.isFinite(body.timestamp)
      || Math.abs(Date.now() - body.timestamp) > 30_000
    ) {
      throw new Error('SOUL_MESH_RESPONSE_INVALID');
    }
    if (secret && !verifySoulMeshResponse(message, body, secret)) {
      throw new Error('SOUL_MESH_RESPONSE_HMAC_INVALID');
    }
    if (!response.ok || body.kind === 'error') {
      throw new Error(`SOUL_MESH_REMOTE_ERROR:${target}`);
    }
    return body;
  } finally {
    clearTimeout(timer);
  }
}

export const N06_OUT_CHANNELS = PEERS.map(x => `N06.OUT.${x}`);
export const N06_IN_CHANNELS = PEERS.map(x => `N06.IN.${x}`);
