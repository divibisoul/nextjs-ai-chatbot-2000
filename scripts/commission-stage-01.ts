import { randomUUID } from 'node:crypto';
import { createSoulMeshNonce, signSoulMeshMessage, verifySoulMeshResponse } from '../lib/soul-mesh/SoulMeshHmac.ts';

const targetUrl = (process.env.SOUL_MESH_N05_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
const secret = (process.env.SOUL_MESH_HMAC_SECRET ?? '').trim();
const token = process.env.SOUL_MESH_TOKEN ?? 'ci-stage-token';
const correlationId = process.env.SOUL_STAGE_CORRELATION_ID?.trim() || randomUUID();
if (!secret) throw new Error('STAGE01_HMAC_SECRET_REQUIRED');

const message = {
  protocol: 'soul-mesh/1' as const,
  contractVersion: '1.1.0' as const,
  id: randomUUID(),
  correlationId,
  source: 'N06' as const,
  target: 'N05' as const,
  kind: 'request' as const,
  capability: 'mesh.resident.describe@1.0.0',
  payload: { stage: 'N06_N05', upstream: process.env.SOUL_STAGE_UPSTREAM_RESULT ? JSON.parse(process.env.SOUL_STAGE_UPSTREAM_RESULT) : { seed: true } },
  timestamp: Date.now(),
  transport: 'HTTP' as const,
  meta: { runtime: 'nextjs-ai-chatbot-2000', transport: 'HTTP', encoding: 'json', version: '1.1.0', traceId: correlationId }
};
const nonce = createSoulMeshNonce();
message.nonce = nonce;
message.meta = { ...message.meta, nonce, traceId: correlationId };
const hmac = signSoulMeshMessage(message, secret, nonce);

async function main() {
  const response = await fetch(targetUrl + '/api/soul-mesh', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      authorization: 'Bearer ' + token,
      'x-soul-correlation-id': correlationId,
      'x-soul-trace-id': correlationId,
      'x-soul-mesh-nonce': nonce,
      'x-soul-mesh-hmac': hmac
    },
    body: JSON.stringify(message)
  });
  const body = await response.json();
  if (!response.ok) throw new Error('N06_TO_N05_HTTP_' + response.status);
  if (body.source !== 'N05' || body.target !== 'N06' || body.correlationId !== correlationId) throw new Error('STAGE01_N06_TO_N05_ROUTE_OR_CORRELATION_INVALID');
  if (!verifySoulMeshResponse(message, body, secret)) throw new Error('STAGE01_N06_TO_N05_RESPONSE_HMAC_INVALID');
  console.log(JSON.stringify({state:'REAL',direction:'N06->N05',capability:message.capability,correlationId,responseMessageId:body.id,payload:body.payload}));
}

main().catch(error => { console.error(error); process.exit(1); });