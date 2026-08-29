import { NextResponse } from 'next/server';
import type { SoulMeshMessage } from '@/lib/soul-mesh/SoulMeshProtocol';
import { executeN06Capability } from '@/lib/soul-mesh/N06CapabilityDispatcher';
import { N06AgentRegistry } from '@/lib/soul-mesh/N06AgentRegistry';
import { getN06DeclaredCapabilities, getN06ExecutableCapabilities } from '@/lib/soul-core/Nucleus05Runtime';
import { NUCLEUS_06_TOOL_IDS } from '@/lib/soul-core/Nucleus05ToolRegistry';

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
    protocol: 'soul-mesh/1', id: crypto.randomUUID(), correlationId: message.correlationId,
    source: NUCLEUS_ID, target: message.source, kind, capability: message.capability,
    payload, timestamp: Date.now(),
  } satisfies SoulMeshMessage, { status });
}

function createN06Agents() {
  const registry = new N06AgentRegistry();
  const executable = getN06ExecutableCapabilities();
  registry.register({
    id: 'N06-cognitive-agent',
    name: 'N06 Cognitive Agent',
    capabilities: executable,
    execute: (message) => executeN06Capability(message.capability!, message.payload),
  });
  registry.register({
    id: 'N06-tool-agent',
    name: 'N06 Tool Agent',
    capabilities: NUCLEUS_06_TOOL_IDS.map((id) => `tool:${id}`),
    execute: (message) => executeN06Capability(message.capability!, message.payload),
  });
  registry.register({
    id: 'N06-mesh-agent',
    name: 'N06 Mesh Agent',
    capabilities: ['mesh.ping', 'mesh.describe'],
    execute: (message) => message.capability === 'mesh.ping'
      ? { ok: true, nucleus: NUCLEUS_ID, processedAt: Date.now() }
      : { nucleus: NUCLEUS_ID, peers: [...PEERS], declaredCapabilities: getN06DeclaredCapabilities(), executableCapabilities: executable, agents: registry.describe(), inChannels: PEERS.map(peer => `N06.IN.${peer}`), outChannels: PEERS.map(peer => `N06.OUT.${peer}`) },
  });
  return registry;
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_PAYLOAD_BYTES) return NextResponse.json({ error: 'SOUL_MESH_PAYLOAD_TOO_LARGE' }, { status: 413 });

  let message: SoulMeshMessage;
  try { message = JSON.parse(raw) as SoulMeshMessage; }
  catch { return NextResponse.json({ error: 'INVALID_SOUL_MESH_JSON' }, { status: 400 }); }

  const valid = message && message.protocol === 'soul-mesh/1'
    && typeof message.id === 'string' && message.id.length > 0
    && typeof message.correlationId === 'string' && message.correlationId.length > 0
    && NUCLEI.has(message.source) && message.target === NUCLEUS_ID && message.source !== NUCLEUS_ID
    && typeof message.capability === 'string' && message.capability.length > 0
    && Number.isFinite(message.timestamp) && Math.abs(Date.now() - message.timestamp) <= MAX_CLOCK_SKEW_MS;

  if (!valid) return NextResponse.json({ error: 'INVALID_SOUL_MESH_MESSAGE' }, { status: 400 });
  if (message.kind !== 'request') return NextResponse.json({ accepted: true, correlationId: message.correlationId, source: NUCLEUS_ID, target: message.source });

  const agents = createN06Agents();
  try {
    return result(message, 'response', await agents.execute(message));
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const code = detail.startsWith('CAPABILITY_HANDLER_NOT_REGISTERED') ? 'CAPABILITY_HANDLER_NOT_REGISTERED'
      : detail.startsWith('UNKNOWN_TOOL') ? 'UNKNOWN_TOOL'
      : detail === 'N06_TOOL_CONTEXT_REQUIRED' ? 'N06_TOOL_CONTEXT_REQUIRED' : 'CAPABILITY_EXECUTION_ERROR';
    return result(message, 'error', { code, message: detail }, code === 'CAPABILITY_HANDLER_NOT_REGISTERED' ? 501 : 500);
  }
}
