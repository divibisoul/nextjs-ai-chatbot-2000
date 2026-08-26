import { NextResponse } from 'next/server';
import type { SoulMeshMessage } from '@/lib/soul-mesh/SoulMeshProtocol';

const NUCLEUS_ID = 'N06';
const NUCLEI = new Set(['N01', 'N02', 'N03', 'N04', 'N05', 'N06']);

function authorized(request: Request): boolean {
  const token = process.env.SOUL_MESH_TOKEN;
  return !token || request.headers.get('authorization') === `Bearer ${token}`;
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const message = (await request.json().catch(() => null)) as SoulMeshMessage | null;
  if (!message || message.protocol !== 'soul-mesh/1' || !message.id || !message.correlationId || !NUCLEI.has(message.source) || message.target !== NUCLEUS_ID || message.source === NUCLEUS_ID || !message.capability) return NextResponse.json({ error: 'INVALID_SOUL_MESH_MESSAGE' }, { status: 400 });
  if (message.kind !== 'request') return NextResponse.json({ accepted: true, correlationId: message.correlationId, source: NUCLEUS_ID, target: message.source });
  return NextResponse.json({ protocol: 'soul-mesh/1', id: crypto.randomUUID(), correlationId: message.correlationId, source: NUCLEUS_ID, target: message.source, kind: 'response', capability: message.capability, payload: { nucleus: NUCLEUS_ID, accepted: true, execution: 'runtime-required', receivedAt: Date.now() }, timestamp: Date.now() } satisfies SoulMeshMessage);
}
