import crypto from 'node:crypto';

const n02 = (process.env.SOUL_MESH_N02_URL ?? '').replace(/\/$/, '');
const n06 = (process.env.SOUL_MESH_N06_URL ?? '').replace(/\/$/, '');
const secret = process.env.SOUL_MESH_HMAC_SECRET ?? '';
if (!n02 || !n06) throw new Error('Set SOUL_MESH_N02_URL and SOUL_MESH_N06_URL');
if (!secret) throw new Error('Set SOUL_MESH_HMAC_SECRET for the authenticated interoperability probe');

function nonce() { return crypto.randomBytes(24).toString('base64url'); }
function sign(message, value) {
  const canonical = JSON.stringify({
    protocol: message.protocol, id: message.id, correlationId: message.correlationId,
    source: message.source, target: message.target, kind: message.kind,
    capability: message.capability ?? null, payload: message.payload,
    timestamp: message.timestamp, transport: message.transport ?? null,
    meta: message.meta ?? null, nonce: value,
  });
  return crypto.createHmac('sha256', secret).update(canonical, 'utf8').digest('hex');
}

async function probe(base, source, target) {
  const message = {
    protocol: 'soul-mesh/1', id: crypto.randomUUID(), correlationId: crypto.randomUUID(),
    source, target, kind: 'request', capability: 'mesh.ping',
    payload: { probe: 'N02-N06-interoperability', source, target },
    timestamp: Date.now(), transport: 'HTTP',
  };
  const n = nonce();
  const response = await fetch(`${base}/api/soul-mesh`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      'x-soul-mesh-nonce': n,
      'x-soul-mesh-hmac': sign(message, n),
      'x-soul-correlation-id': message.correlationId,
    },
    body: JSON.stringify(message),
  });
  const body = await response.json();
  const ok = response.ok && body.kind === 'response' && body.source === target && body.target === source && body.correlationId === message.correlationId;
  return { direction: `${source}->${target}`, http: response.status, correlationId: message.correlationId, ok, body };
}

const results = [await probe(n06, 'N02', 'N06'), await probe(n02, 'N06', 'N02')];
console.log(JSON.stringify({ protocol: 'soul-mesh/1', pair: 'N02<->N06', results, success: results.every(r => r.ok) }, null, 2));
if (!results.every(r => r.ok)) process.exitCode = 1;
