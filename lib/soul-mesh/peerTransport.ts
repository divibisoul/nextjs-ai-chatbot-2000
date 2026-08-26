import type { SoulMeshMessage, SoulNucleus } from './SoulMeshProtocol';

export const PEERS = ['N01', 'N02', 'N03', 'N04', 'N05'] as const;
export type SoulPeer = typeof PEERS[number];

const ENV_BY_PEER: Record<SoulPeer, string> = {
  N01: 'SOUL_MESH_N01_URL',
  N02: 'SOUL_MESH_N02_URL',
  N03: 'SOUL_MESH_N03_URL',
  N04: 'SOUL_MESH_N04_URL',
  N05: 'SOUL_MESH_N05_URL',
};

export function getPeerUrl(peer: SoulPeer): string | undefined {
  const value = process.env[ENV_BY_PEER[peer]]?.trim();
  return value ? value.replace(/\/$/, '') : undefined;
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 15000);

  try {
    const token = process.env.SOUL_MESH_TOKEN;
    const response = await fetch(`${baseUrl}/api/soul-mesh`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(message),
      signal: controller.signal,
      cache: 'no-store',
    });

    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(`PEER_REQUEST_FAILED:${peer}:${response.status}:${JSON.stringify(body)}`);
    }
    return body as SoulMeshMessage;
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
