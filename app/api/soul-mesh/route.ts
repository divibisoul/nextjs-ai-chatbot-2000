import { NextResponse } from 'next/server';
import { handleMeshMessage } from '@/lib/soul-mesh/endpoint';
import type { SoulMeshMessage } from '@/lib/soul-mesh/SoulMeshProtocol';
import { ensureN06Runtime, N06_CAPABILITIES } from '@/lib/soul-mesh/N06Runtime';

const NUCLEUS_ID = 'N06' as const;
const NUCLEI = new Set(['N01', 'N02', 'N03', 'N04', 'N05', 'N06']);
const PEERS = ['N01', 'N02', 'N03', 'N04', 'N05'] as const;

function authorized(request: Request) {
  const token = process.env.SOUL_MESH_TOKEN;
  return !token || request.headers.get('authorization') === `Bearer ${token}`;
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const message = (await request.json().catch(() => null)) as SoulMeshMessage | null;
  if (!message || message.target !== NUCLEUS_ID || !NUCLEI.has(message.source) || message.source === NUCLEUS_ID) {
    return NextResponse.json({ error: 'INVALID_SOUL_MESH_MESSAGE' }, { status: 400 });
  }

  ensureN06Runtime();

  try {
    const response = await handleMeshMessage(message, {
      'mesh.ping': async payload => ({ ok: true, handler: 'N06.mesh.ping', echoed: payload, processedAt: Date.now() }),
      'mesh.describe': async () => ({
        nucleus: NUCLEUS_ID,
        peers: [...PEERS],
        inChannels: PEERS.map(peer => `N06.IN.${peer}`),
        outChannels: PEERS.map(peer => `N06.OUT.${peer}`),
        capabilities: ['mesh.ping', 'mesh.describe', ...N06_CAPABILITIES],
        status: 'online',
      }),
      'ai-pilot': async payload => ensureN06Runtime().execute({ capability: 'ai-pilot', input: payload }),
      'context-orchestration': async payload => ensureN06Runtime().execute({ capability: 'context-orchestration', input: payload }),
      'streaming': async payload => ensureN06Runtime().execute({ capability: 'streaming', input: payload }),
      'mesh-communication': async payload => ensureN06Runtime().execute({ capability: 'mesh-communication', input: payload }),
    });

    return NextResponse.json(response, { status: response.kind === 'error' ? 501 : 200 });
  } catch (error) {
    return NextResponse.json({
      protocol: 'soul-mesh/1',
      id: crypto.randomUUID(),
      correlationId: message.correlationId,
      source: NUCLEUS_ID,
      target: message.source,
      kind: 'error',
      capability: message.capability,
      payload: { code: 'MESH_RUNTIME_ERROR', detail: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: Date.now(),
    } satisfies SoulMeshMessage, { status: 500 });
  }
}
