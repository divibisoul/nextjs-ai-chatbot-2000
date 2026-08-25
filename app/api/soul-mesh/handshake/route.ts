import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { source?: string; target?: string; protocol?: string } | null;
  if (!body || body.protocol !== 'soul-mesh/1' || body.target !== 'chatbot-2000') {
    return NextResponse.json({ accepted: false, error: 'Invalid handshake' }, { status: 400 });
  }
  return NextResponse.json({ accepted: true, protocol: 'soul-mesh/1', source: 'chatbot-2000', target: body.source ?? null, capabilities: ['conversation'], timestamp: Date.now() });
}
