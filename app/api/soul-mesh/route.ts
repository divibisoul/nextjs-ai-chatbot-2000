import { NextResponse } from 'next/server';
import type { SoulMeshMessage } from '@/lib/soul-mesh/SoulMeshProtocol';
import { executeN06Capability } from '@/lib/soul-mesh/N06CapabilityDispatcher';
import { getN06DeclaredCapabilities, getN06ExecutableCapabilities } from '@/lib/soul-core/Nucleus05Runtime';

const NUCLEUS_ID = 'N06' as const;
const NUCLEI = new Set(['N01', 'N02', 'N03', 'N04', 'N05', 'N06']);
const PEERS = ['N01', 'N02', 'N03', 'N04', 'N05'] as const;
const MAX_PAYLOAD_BYTES = 1024 * 1024;
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

function authorized(request: Request) {
  const token = process.env.SOUL_MESH_TOKEN;
  return !token || request.headers.get('authorization') === `Bearer ${token}`;
}

function result(message: SoulMeshMessage, kind: 'response' | 'error', payload: unknown, status = 200) {
  return NextResponse.json({
    protocol: 'soul-mesh/1',
    id: crypto.randomUUID(),
    correlationId: message.correlationId,
    source: NUCLEUS_ID,
    target: message.source,
    kind,
    capability: message.capability,
    payload,
    timestamp: Date.now(),
  } satisfies SoulMeshMessage, { status });
}

function validateMessage(message: SoulMeshMessage): string | null {
  if (message.protocol !== 'soul-mesh/1') return 'INVALID_SOUL_MESH_PROTOCOL';
  if (!message.id || !message.correlationId) return 'MISSING_SOUL_MESH_ID';
  if (!NUCLEI.has(message.source) || message.target !== NUCLEUS_ID || message.source === NUCLEUS_ID) return 'INVALID_SOUL_MESH_ROUTE';
  if (message.kind === 'request' && (!message.capability || message.capability.length === 0)) return 'MISSING_SOUL_MESH_CAPABILITY';
  if (!Number.isFinite(message.timestamp) || Math.abs(Date.now() - message.timestamp) > MAX_CLOCK_SKEW_MS) return 'INVALID_SOUL_MESH_TIMESTAMP';
  return null;
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_PAYLOAD_BYTES) return NextResponse.json({ error: 'SOUL_MESH_PAYLOAD_TOO_LARGE' }, { status: 413 });

  let message: SoulMeshMessage;
  try {
    message = JSON.parse(raw) as SoulMeshMessage;
  } catch {
    return NextResponse.json({ error: 'INVALID_SOUL_MESH_JSON' }, { status: 400 });
  }

  const validationError = validateMessage(message);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });
  if (message.kind !== 'request') return NextResponse.json({ accepted: true, correlationId: message.correlationId, source: NUCLEUS_ID, target: message.source });

  if (message.capability === 'mesh.ping') return result(message, 'response', { ok: true, nucleus: NUCLEUS_ID, processedAt: Date.now() });
  if (message.capability === 'mesh.describe') {
    return result(message, 'response', {
      nucleus: NUCLEUS_ID,
      peers: [...PEERS],
      inChannels: PEERS.map(peer => `N06.IN.${peer}`),
      outChannels: PEERS.map(peer => `N06.OUT.${peer}`),
      declaredCapabilities: getN06DeclaredCapabilities(),
      executableCapabilities: getN06ExecutableCapabilities(),
    });
  }

  try {
    return result(message, 'response', await executeN06Capability(message.capability!, message.payload));
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const code = detail.startsWith('N06_UNKNOWN_TOOL') ? 'UNKNOWN_TOOL'
      : detail.startsWith('N06_TOOL_CONTEXT_REQUIRED') ? 'TOOL_CONTEXT_REQUIRED'
        : detail.startsWith('N06_CAPABILITY_NOT_REGISTERED') ? 'CAPABILITY_HANDLER_NOT_REGISTERED'
          : detail.startsWith('N06_CAPABILITY_NOT_READY') ? 'CAPABILITY_NOT_READY'
            : 'CAPABILITY_EXECUTION_ERROR';
    return result(message, 'error', { code, message: detail }, code === 'CAPABILITY_HANDLER_NOT_REGISTERED' ? 501 : 500);
  }
}
