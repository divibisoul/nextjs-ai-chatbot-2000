import { NextResponse } from 'next/server';
import { configuredPeers, getPeerUrl, PEERS, sendToPeer } from '@/lib/soul-mesh/peerTransport';
import { createSoulMeshMessage } from '@/lib/soul-mesh/SoulMeshProtocol';

function authorized(request: Request) {
  const token = process.env.SOUL_MESH_TOKEN;
  return !token || request.headers.get('authorization') === `Bearer ${token}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const probe = new URL(request.url).searchParams.get('probe') === 'true';
  if (!probe) return NextResponse.json({ nucleus: 'N06', peers: configuredPeers(), timestamp: Date.now() });

  const results = await Promise.all(PEERS.map(async peer => {
    if (!getPeerUrl(peer)) return { peer, configured: false, reachable: false, error: 'PEER_ENDPOINT_NOT_CONFIGURED' };
    const started = Date.now();
    try {
      await sendToPeer(peer, createSoulMeshMessage({
        correlationId: crypto.randomUUID(),
        source: 'N06',
        target: peer,
        kind: 'request',
        capability: 'mesh.ping',
        payload: { probe: true },
      }), { timeoutMs: 10000 });
      return { peer, configured: true, reachable: true, latencyMs: Date.now() - started };
    } catch (error) {
      return { peer, configured: true, reachable: false, latencyMs: Date.now() - started, error: error instanceof Error ? error.message : 'UNKNOWN_ERROR' };
    }
  }));

  return NextResponse.json({ nucleus: 'N06', peers: results, timestamp: Date.now() });
}
