import { NextResponse } from 'next/server';
import { getN06DeclaredCapabilities, getN06ExecutableCapabilities } from '@/lib/soul-core/Nucleus05Runtime';

const NUCLEI = new Set(['N01', 'N02', 'N03', 'N04', 'N05', 'N06', 'N07']);

function authorized(request: Request) {
  const secret = process.env.SOUL_MESH_HMAC_SECRET?.trim() || process.env.SOUL_MESH_SECRET?.trim();
  if (secret) {
    const token = request.headers.get('x-soul-mesh-secret')?.trim();
    return Boolean(token && token === secret);
  }
  const token = process.env.SOUL_MESH_TOKEN?.trim();
  if (token) return request.headers.get('authorization') === `Bearer ${token}`;
  return process.env.NODE_ENV !== 'production';
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ accepted: false, error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json().catch(() => null) as { source?: string; target?: string; protocol?: string } | null;
  if (!body || body.protocol !== 'soul-mesh/1' || body.target !== 'N06' || !body.source || !NUCLEI.has(body.source) || body.source === 'N06') {
    return NextResponse.json({ accepted: false, error: 'INVALID_SOUL_MESH_HANDSHAKE' }, { status: 400 });
  }
  return NextResponse.json({
    accepted: true,
    protocol: 'soul-mesh/1',
    source: 'N06',
    target: body.source,
    capabilities: getN06DeclaredCapabilities(),
    executableCapabilities: getN06ExecutableCapabilities(),
    timestamp: Date.now(),
  });
}
