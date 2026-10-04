import { randomUUID } from 'node:crypto';
import { sendFromN06 } from '../lib/soul-mesh/N06PeerAdapter.ts';

const correlationId = process.env.SOUL_STAGE_CORRELATION_ID?.trim() || randomUUID();
const upstream = process.env.SOUL_STAGE_UPSTREAM_RESULT ? JSON.parse(process.env.SOUL_STAGE_UPSTREAM_RESULT) : { seed: true };

sendFromN06(
  'N05',
  'mesh.resident.describe@1.0.0',
  { stage: 'N06_N05', upstream, requestedAt: new Date().toISOString() },
  5000,
  correlationId,
  correlationId,
).then(result => {
  console.log(JSON.stringify({ state: 'REAL', direction: 'N06->N05', capability: 'mesh.resident.describe@1.0.0', correlationId, evidence: 'authenticated native N05 response verified by N06 peer adapter', result }));
}).catch(error => {
  console.error(error);
  process.exit(1);
});