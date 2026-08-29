import { NextResponse } from 'next/server';
import { handleMeshMessage } from '@/lib/soul-mesh/endpoint';
import { isSoulMeshMessage, type SoulMeshMessage } from '@/lib/soul-mesh/SoulMeshProtocol';
import { ensureN06Runtime } from '@/lib/soul-mesh/N06Runtime';
import { N06_CAPABILITIES, supportsN06Capability } from '@/lib/soul-mesh/N06Capabilities';

const NUCLEUS_ID = 'N06' as const;
const MAX_BODY_BYTES = 1_000_000;

function authorized(request: Request) {
  if (process.env.MESH_AUTH_DISABLED === 'true') return true;
  const token = process.env.SOUL_MESH_TOKEN?.trim();
  if (!token) return false;
  return request.headers.get('authorization') === `Bearer ${token}`;
}

function handlers() {
  const runtime = ensureN06Runtime();
  return Object.fromEntries(
    N06_CAPABILITIES.map(capability => [
      capability,
      (payload: unknown) => runtime.execute(capability, payload),
    ]),
  );
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'SOUL_MESH_PAYLOAD_TOO_LARGE' }, { status: 413 });
  }

  const body = await request.json().catch(() => null);
  if (!isSoulMeshMessage(body)) {
    return NextResponse.json({ error: 'INVALID_SOUL_MESH_MESSAGE' }, { status: 400 });
  }
  if (body.target !== NUCLEUS_ID || body.source === NUCLEUS_ID) {
    return NextResponse.json({ error: 'INVALID_SOUL_MESH_ROUTE' }, { status: 400 });
  }
  if (body.kind === 'request' && (!body.capability || !supportsN06Capability(body.capability))) {
    return NextResponse.json({
      error: 'CAPABILITY_NOT_SUPPORTED',
      nucleus: NUCLEUS_ID,
      capability: body.capability ?? null,
      capabilities: [...N06_CAPABILITIES],
    }, { status: 400 });
  }

  try {
    const response = await handleMeshMessage(body as SoulMeshMessage, handlers());
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      protocol: 'soul-mesh/1',
      id: crypto.randomUUID(),
      correlationId: body.correlationId,
      source: NUCLEUS_ID,
      target: body.source,
      kind: 'error',
      capability: body.capability,
      payload: {
        code: 'MESH_RUNTIME_ERROR',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: Date.now(),
    } satisfies SoulMeshMessage, { status: 500 });
  }
}
