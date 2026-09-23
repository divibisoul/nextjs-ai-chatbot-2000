import { sendTo } from '@/lib/soul-mesh/peer-client';

export type N06FederatedContextRequest = {
  input: string;
  researchPayload: Record<string, unknown>;
  perceptionPayload?: Record<string, unknown>;
  allowResearchSkip?: boolean;
  correlationId?: string;
};

export type N06FederatedContextResult = {
  correlationId: string;
  research?: Record<string, unknown>;
  perception?: Record<string, unknown>;
  audit: Record<string, unknown>;
  cycle: Record<string, unknown>;
  barrier: string;
};

function extractResult(response: any, correlationId: string): N06FederatedContextResult {
  if (!response || response.kind === 'error') {
    const detail = response?.payload?.error ?? response?.payload?.detail ?? 'OCTACORE_FEDERATED_CONTEXT_FAILED';
    throw new Error(String(detail));
  }
  const payload = response.payload as Record<string, unknown> | undefined;
  const metadata = payload?.metadata as Record<string, unknown> | undefined;
  const raw = typeof metadata?.octacore_json === 'string' ? metadata.octacore_json : '';
  if (!raw) throw new Error('OCTACORE_FEDERATED_CONTEXT_INVALID_RESPONSE');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('OCTACORE_FEDERATED_CONTEXT_INVALID_JSON');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('OCTACORE_FEDERATED_CONTEXT_INVALID_PAYLOAD');
  }
  return parsed as N06FederatedContextResult;
}

export async function executeN06FederatedContext(
  request: N06FederatedContextRequest,
): Promise<N06FederatedContextResult> {
  const input = request.input.trim();
  if (!input) throw new Error('OCTACORE_INPUT_REQUIRED');
  const correlationId = request.correlationId?.trim() || crypto.randomUUID();

  const response = await sendTo(
    'N07',
    'octacore.federated_context_cycle',
    {
      input,
      research_payload: request.researchPayload,
      perception_payload: request.perceptionPayload,
      allow_research_skip: Boolean(request.allowResearchSkip),
    },
    60_000,
    correlationId,
  );

  return extractResult(response, correlationId);
}
