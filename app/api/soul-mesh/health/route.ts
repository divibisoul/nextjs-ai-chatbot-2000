import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    protocol: 'soul-mesh/1',
    nucleus: 'chatbot-2000',
    status: 'ready',
    capabilities: ['conversation'],
    timestamp: Date.now(),
  });
}
