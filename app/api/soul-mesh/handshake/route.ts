import { NextResponse } from 'next/server';
import { N06_CAPABILITIES } from '@/lib/soul-mesh/N06Capabilities';
import { SOUL_MESH_PROTOCOL, SOUL_NUCLEI } from '@/lib/soul-mesh/SoulMeshProtocol';

const NUCLEUS_ID = 'N06' as const;

function authorized(request: Request) {
  const token = process.env.SOUL_MESH_TOKEN?.trim();
  if (!token) return process.env.NODE_ENV !== 'production';
  return request.headers.get('authorization') === `Bearer ${token}`;
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ accepted: false, error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null) as { source?: string; target?: string; protocol?: string } | null;
  const source = body?.source;
  if (
    !body ||
    body.protocol !== SOUL_MESH_PROTOCOL ||
    body.target !== NUCLEUS_ID ||
    !source ||
    !(SOUL_NUCLEI as readonly string[]).includes(source) ||
    source === NUCLEUS_ID
  ) {
    return NextResponse.json({ accepted: false, error: 'INVALID_SOUL_MESH_HANDSHAKE' }, { status: 400 });
  }

  return NextResponse.json({
    accepted: true,
    protocol: SOUL_MESH_PROTOCOL,
    source: NUCLEUS_ID,
    target: source,
    capabilities: [...N06_CAPABILITIES],
    timestamp: Date.now(),
  });
}
