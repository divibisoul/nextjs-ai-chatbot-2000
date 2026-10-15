import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import adapterModule from '../lib/soul-mesh/N06PeerAdapter.ts';
const { sendFromN06 } = adapterModule.default ?? adapterModule;
if (typeof sendFromN06 !== 'function') throw new Error('N06_ADAPTER_EXPORT_NOT_FOUND');

const endpoint = process.env.SOUL_MESH_N07_URL?.trim();
const secret = process.env.SOUL_MESH_HMAC_SECRET?.trim();
if (!endpoint) throw new Error('SOUL_MESH_N07_URL_REQUIRED');
if (!secret || Buffer.byteLength(secret, 'utf8') < 32) throw new Error('SOUL_MESH_HMAC_SECRET_TOO_SHORT');

const operationId = randomUUID();
const ping = await sendFromN06(
  'N07',
  'mesh.ping',
  { probe: 'n06-n07-real-process', operationId },
  5000,
  operationId,
  operationId,
  0,
);
assert.equal(ping?.ok, true, 'N07 must acknowledge a real authenticated Mesh ping');
assert.equal(ping?.nucleus, 'N07', 'N07 must identify itself in the actual response');
assert.equal(ping?.contractVersion, '1.1.0', 'N07 must answer with the canonical contract version');

const description = await sendFromN06(
  'N07',
  'mesh.describe',
  { probe: 'n06-n07-real-process-capability-discovery' },
  5000,
  randomUUID(),
  operationId,
  0,
);
assert.equal(description?.nucleus, 'N07', 'N07 capability discovery must reach the live N07 service');
assert.ok(Array.isArray(description?.operations), 'N07 must expose the live engine operation registry');
assert.ok(Array.isArray(description?.transports) && description.transports.includes('HTTP'));

console.log('N06_N07_REAL_PROCESS_E2E_PASS', JSON.stringify({
  transport: 'HTTP',
  requestAuthentication: 'HMAC-SHA256',
  responseAuthentication: 'N07-Go-legacy-HMAC-verified',
  ping: ping?.nucleus,
  describe: description?.nucleus,
  operationId,
}));
