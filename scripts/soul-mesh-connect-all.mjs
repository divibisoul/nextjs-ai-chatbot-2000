import crypto from 'node:crypto';

const N06 = 'N06';
const peers = ['N01','N02','N03','N04','N05'];
const timeoutMs = Number(process.env.SOUL_MESH_CONNECT_TIMEOUT_MS || 10000);
const secret = process.env.SOUL_MESH_SECRET || '';

function urlFor(peer) {
  return (process.env[`SOUL_MESH_${peer}_URL`] || '').replace(/\/$/, '');
}
function envelope(target, capability, payload = {}) {
  const correlationId = crypto.randomUUID();
  const base = { version:'1.0', messageId:crypto.randomUUID(), source:N06, target, timestamp:Date.now(), nonce:crypto.randomUUID(), correlationId, type:'CAPABILITY_REQUEST', payload:{ capability, payload } };
  const unsigned = JSON.stringify(base);
  return { ...base, hmac: secret ? crypto.createHmac('sha256', secret).update(unsigned).digest('hex') : '' };
}
async function post(peer, message) {
  const url = urlFor(peer);
  if (!url) return { peer, configured:false, ok:false, reason:'URL_NOT_CONFIGURED' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${url}/mesh/in`, { method:'POST', headers:{'content-type':'application/json','x-soul-nucleus':N06,'x-soul-target':peer,'x-correlation-id':message.correlationId}, body:JSON.stringify(message), signal:controller.signal });
    const body = await response.json().catch(() => null);
    return { peer, configured:true, ok:response.ok, status:response.status, correlationId:message.correlationId, body };
  } catch (error) {
    return { peer, configured:true, ok:false, correlationId:message.correlationId, error:error instanceof Error ? error.message : String(error) };
  } finally { clearTimeout(timer); }
}

const results = await Promise.all(peers.map((peer) => post(peer, envelope(peer, 'mesh.ping', { requestedBy:N06 }))));
console.log(JSON.stringify({ source:N06, testedAt:new Date().toISOString(), results, configured:results.filter(r=>r.configured).length, reachable:results.filter(r=>r.ok).length }, null, 2));
process.exitCode = results.some(r => r.configured && !r.ok) ? 1 : 0;
