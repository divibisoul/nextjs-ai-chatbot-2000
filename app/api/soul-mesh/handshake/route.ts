import { NextResponse } from 'next/server';
import { getN06DeclaredCapabilities, getN06ExecutableCapabilities } from '@/lib/soul-core/Nucleus05Runtime';

const NUCLEI = new Set(['N01', 'N02', 'N03', 'N04', 'N05', 'N06']);

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { source?: string; target?: string; protocol?: string } | null;
  if (!body || body.protocol !== 'soul-mesh/1' || body.target !== 'N06' || !body.source || !NUCLEI.has(body.source) || body.source === 'N06') {
    return NextResponse.json({ accepted: false, error: 'Invalid handshake' }, { status: 400 });
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
