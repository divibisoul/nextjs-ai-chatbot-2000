import { NextResponse } from 'next/server';
import { getN06Peers, probeAllN06Peers } from '@/lib/soul-mesh/N06PeerAdapter';

function authorized(request: Request) {
  const token = process.env.SOUL_MESH_TOKEN?.trim();
  if (token) return request.headers.get('authorization') === `Bearer ${token}`;
  return process.env.NODE_ENV !== 'production';
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const probe = new URL(request.url).searchParams.get('probe') === 'true';
  if (!probe) {
    return NextResponse.json({
      nucleus: 'N06',
      peers: getN06Peers(),
      timestamp: Date.now(),
    });
  }

  const results = await probeAllN06Peers();
  const reachable = results.filter(result => result.reachable).length;
  return NextResponse.json({
    nucleus: 'N06',
    summary: {
      total: results.length,
      reachable,
      configured: getN06Peers().filter(peer => Boolean(peer.url)).length,
    },
    peers: results,
    timestamp: Date.now(),
  });
}
