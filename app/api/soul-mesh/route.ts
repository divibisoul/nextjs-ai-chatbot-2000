import { NextResponse } from 'next/server';
import type { SoulMeshMessage } from '@/lib/soul-mesh/SoulMeshProtocol';

function authorized(request: Request): boolean {
  const token = process.env.SOUL_MESH_TOKEN;
  return !token || request.headers.get('authorization') === `Bearer ${token}`;
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const message = (await request.json()) as SoulMeshMessage;
  if (message.protocol !== 'soul-mesh/1' || message.target !== 'chatbot-2000') return NextResponse.json({ error: 'Invalid Soul Mesh message' }, { status: 400 });
  if (message.kind !== 'request') return NextResponse.json({ accepted: true });
  const response: SoulMeshMessage = { protocol: 'soul-mesh/1', id: crypto.randomUUID(), correlationId: message.correlationId, source: 'chatbot-2000', target: message.source, kind: 'response', capability: message.capability, payload: { nucleus: 'chatbot-2000', capability: message.capability, received: true, payload: message.payload }, timestamp: Date.now() };
  const peer = process.env.SOUL_MESH_CHATBOTS_URL;
  if (peer) await fetch(`${peer.replace(/\/$/, '')}/api/soul-mesh`, { method: 'POST', headers: { 'content-type': 'application/json', ...(process.env.SOUL_MESH_TOKEN ? { authorization: `Bearer ${process.env.SOUL_MESH_TOKEN}` } : {}) }, body: JSON.stringify(response) });
  return NextResponse.json({ accepted: true, correlationId: message.correlationId });
}
