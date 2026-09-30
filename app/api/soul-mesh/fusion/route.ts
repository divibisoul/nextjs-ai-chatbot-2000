import { NextResponse } from 'next/server';
import { executeN06Fusion, N06_FUSION_CAPABILITIES, N06_ID, type N06FusionCapability, type N06FusionInput } from '@/lib/soul-mesh/N06FusionRuntime';
import { isSoulMeshMessage, type SoulMeshMessage, type SoulNucleus } from '@/lib/soul-mesh/SoulMeshProtocol';

const PEERS = ['N01', 'N02', 'N03', 'N04', 'N05'] as const;

function authorized(request: Request) {
  const token = process.env.SOUL_MESH_TOKEN;
  return Boolean(token) && request.headers.get('authorization') === `Bearer ${token}`;
}

function errorMessage(request: SoulMeshMessage, code: string, detail?: string): SoulMeshMessage {
  return {
    protocol: 'soul-mesh/1',
    id: crypto.randomUUID(),
    correlationId: request.correlationId,
    source: N06_ID,
    target: request.source,
    kind: 'error',
    capability: request.capability,
    payload: { code, ...(detail ? { detail } : {}) },
    timestamp: Date.now(),
  };
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({
    protocol: 'soul-mesh/1',
    nucleus: N06_ID,
    status: 'ready',
    peers: [...PEERS],
    capabilities: [...N06_FUSION_CAPABILITIES],
    tools: ['getWeather', 'createDocument', 'updateDocument', 'requestSuggestions'],
    fusion: { enabled: true, mode: 'capability-mediated', independencePreserved: true },
    timestamp: Date.now(),
  });
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const message = await request.json().catch(() => null);
  if (!isSoulMeshMessage(message) || message.target !== N06_ID || message.kind !== 'request') {
    return NextResponse.json({ error: 'INVALID_SOUL_MESH_MESSAGE' }, { status: 400 });
  }
  if (!message.capability || !N06_FUSION_CAPABILITIES.includes(message.capability as N06FusionCapability)) {
    return NextResponse.json(errorMessage(message, 'CAPABILITY_NOT_FOUND'), { status: 404 });
  }
  try {
    const payload = await executeN06Fusion(message.capability as N06FusionCapability, (message.payload ?? {}) as N06FusionInput);
    const response: SoulMeshMessage = {
      protocol: 'soul-mesh/1',
      id: crypto.randomUUID(),
      correlationId: message.correlationId,
      source: N06_ID,
      target: message.source as SoulNucleus,
      kind: 'response',
      capability: message.capability,
      payload,
      timestamp: Date.now(),
    };
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(errorMessage(message, 'CAPABILITY_EXECUTION_ERROR', error instanceof Error ? error.message : 'Unknown error'), { status: 500 });
  }
}
