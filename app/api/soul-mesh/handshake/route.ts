import { NextResponse } from 'next/server';
import { N06_CAPABILITIES } from '@/lib/soul-mesh/N06Runtime';

const NUCLEUS_ID = 'N06' as const;
const PROTOCOL = 'soul-mesh/1' as const;
const NUCLEI = new Set(['N01', 'N02', 'N03', 'N04', 'N05']);

function authorized(request: Request) {
  const token = process.env.SOUL_MESH_TOKEN;
  return !token || request.headers.get('authorization') === `Bearer ${token}`;
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ accepted: false, error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => null) as { source?: string; target?: string; protocol?: string } | null;
  if (!body || body.protocol !== PROTOCOL || body.target !== NUCLEUS_ID || !body.source || !NUCLEI.has(body.source)) {
    return NextResponse.json({ accepted: false, error: 'Invalid handshake' }, { status: 400 });
  }
  return NextResponse.json({
    accepted: true,
    protocol: PROTOCOL,
    source: NUCLEUS_ID,
    target: body.source,
    capabilities: ['mesh.ping', 'mesh.describe', ...N06_CAPABILITIES],
    timestamp: Date.now(),
  });
}
