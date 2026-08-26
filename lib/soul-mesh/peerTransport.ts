import type { SoulMeshMessage, SoulNucleus } from './SoulMeshProtocol';
import { isSoulMeshMessage } from './SoulMeshProtocol';

export const PEERS = ['N01', 'N02', 'N03', 'N04', 'N05'] as const;
export type SoulPeer = typeof PEERS[number];

const ENV_BY_PEER: Record<SoulPeer, string> = {
  N01: 'SOUL_MESH_N01_URL', N02: 'SOUL_MESH_N02_URL', N03: 'SOUL_MESH_N03_URL',
  N04: 'SOUL_MESH_N04_URL', N05: 'SOUL_MESH_N05_URL',
};

export function getPeerUrl(peer: SoulPeer): string | undefined {
  const value = process.env[ENV_BY_PEER[peer]]?.trim();
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return undefined;
    return url.toString().replace(/\/$/, '');
  } catch {
    return undefined;
  }
}

export function configuredPeers() {
  return PEERS.map(peer => ({
    peer,
    env: ENV_BY_PEER[peer],
    configured: Boolean(getPeerUrl(peer)),
    url: getPeerUrl(peer) ?? null,
  }));
}

export async function sendToPeer(
  peer: SoulPeer,
  message: SoulMeshMessage,
  options: { timeoutMs?: number } = {},
): Promise<SoulMeshMessage> {
  const baseUrl = getPeerUrl(peer);
  if (!baseUrl) throw new Error(`PEER_ENDPOINT_NOT_CONFIGURED:${peer}`);
  if (message.target !== peer || message.source !== 'N06') throw new Error('INVALID_OUTBOUND_MESH_ROUTE');

  const timeoutMs = Math.min(Math.max(options.timeoutMs ?? 15_000, 1_000), 60_000);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const token = process.env.SOUL_MESH_TOKEN?.trim();
    const response = await fetch(`${baseUrl}/api/soul-mesh`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(message),
      signal: controller.signal,
      cache: 'no-store',
    });

    const raw = await response.text();
    let body: unknown = null;
    try { body = raw ? JSON.parse(raw) : null; } catch { body = null; }

    if (!response.ok) throw new Error(`PEER_REQUEST_FAILED:${peer}:${response.status}`);
    if (!isSoulMeshMessage(body)) throw new Error(`INVALID_PEER_MESH_RESPONSE:${peer}`);
    if (body.source !== peer || body.target !== 'N06' || body.correlationId !== message.correlationId) {
      throw new Error(`INVALID_PEER_MESH_CORRELATION:${peer}`);
    }
    return body;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error(`PEER_REQUEST_TIMEOUT:${peer}`);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function isPeer(value: string): value is SoulPeer {
  return (PEERS as readonly string[]).includes(value);
}

export type MeshPeerStatus = {
  peer: SoulNucleus;
  configured: boolean;
  reachable: boolean;
  latencyMs?: number;
  error?: string;
};
