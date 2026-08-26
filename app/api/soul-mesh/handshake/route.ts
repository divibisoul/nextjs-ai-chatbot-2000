import { NextResponse } from 'next/server';
import { SOUL_NUCLEI, SOUL_MESH_PROTOCOL, type SoulNucleus } from '@/lib/soul-mesh/SoulMeshProtocol';
import { NUCLEUS_05_CAPABILITIES } from '@/lib/soul-core/Nucleus05Capabilities';

const NUCLEUS_ID: SoulNucleus = 'N06';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { source?: string; target?: string; protocol?: string } | null;
  const source = body?.source;
  const target = body?.target;
  const validPeer = typeof source === 'string' && SOUL_NUCLEI.includes(source as SoulNucleus) && source !== NUCLEUS_ID;

  if (!body || body.protocol !== SOUL_MESH_PROTOCOL || target !== NUCLEUS_ID || !validPeer) {
    return NextResponse.json({ accepted: false, error: 'Invalid Soul Mesh handshake' }, { status: 400 });
  }

  return NextResponse.json({
    accepted: true,
    protocol: SOUL_MESH_PROTOCOL,
    source: NUCLEUS_ID,
    target: source,
    capabilities: [...NUCLEUS_05_CAPABILITIES],
    inbound: true,
    outbound: true,
    timestamp: Date.now(),
  });
}
