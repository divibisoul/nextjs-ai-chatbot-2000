import crypto from 'node:crypto';

const N06 = 'N06';
const peers = ['N01','N02','N03','N04','N05','N07'];
const timeoutMs = Number(process.env.SOUL_MESH_CONNECT_TIMEOUT_MS || 10000);
const secret = process.env.SOUL_MESH_HMAC_SECRET || process.env.SOUL_MESH_SECRET || '';
const token = process.env.SOUL_MESH_TOKEN || '';

function urlFor(peer) {
  return (process.env[`SOUL_MESH_${peer}_URL`] || '').replace(/\/$/, '');
}

function canonical(message, nonce) {
  return JSON.stringify({
    protocol: message.protocol,
    id: message.id,
    correlationId: message.correlationId,
    source: message.source,
    target: message.target,
    kind: message.kind,
    capability: message.capability ?? null,
    payload: message.payload,
    timestamp: message.timestamp,
    transport: message.transport ?? null,
    meta: message.meta ?? null,
    nonce,
  });
}

function envelope(target, capability, payload = {}) {
  const correlationId = crypto.randomUUID();
  const id = crypto.randomUUID();
  const nonce = crypto.randomBytes(24).toString('base64url');
  const message = {
    protocol:'soul-mesh/1',
    contractVersion:'1.1.0',
    id,
    correlationId,
    source:N06,
    target,
    kind:'request',
    capability,
    payload,
    timestamp:Date.now(),
    transport:'HTTP',
    meta:{
      runtime:'nextjs-ai-chatbot-2000-connect-all',
      transport:'HTTP',
      encoding:'json',
      version:'1.1.0',
      nonce,
      traceId:correlationId,
    },
  };
  return { message, nonce };
}

async function post(peer, capability = 'mesh.ping', payload = { requestedBy:N06 }) {
  const url = urlFor(peer);
  if (!url) return { peer, configured:false, ok:false, reason:'URL_NOT_CONFIGURED' };
  const { message, nonce } = envelope(peer, capability, payload);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = {
      'content-type':'application/json',
      'accept':'application/json',
      'x-soul-nucleus':N06,
      'x-soul-target':peer,
      'x-correlation-id':message.correlationId,
      'x-soul-trace-id':message.meta.traceId,
    };
    if (secret) {
      headers['x-soul-mesh-nonce'] = nonce;
      headers['x-soul-mesh-hmac'] = crypto.createHmac('sha256', secret).update(canonical(message, nonce)).digest('hex');
    } else if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${url}/api/soul-mesh`, {
      method:'POST',
      headers,
      body:JSON.stringify(message),
      signal:controller.signal,
      cache:'no-store',
    });
    const body = await response.json().catch(() => null);
    const valid = Boolean(
      body &&
      body.protocol === message.protocol &&
      body.contractVersion === message.contractVersion &&
      body.correlationId === message.correlationId &&
      body.source === peer &&
      body.target === N06 &&
      (body.kind === 'response' || body.kind === 'error')
    );
    return {
      peer,
      configured:true,
      ok:response.ok && valid && body.kind === 'response',
      status:response.status,
      contractVersion:message.contractVersion,
      correlationId:message.correlationId,
      responseValid:valid,
      body,
    };
  } catch (error) {
    return {
      peer,
      configured:true,
      ok:false,
      contractVersion:message.contractVersion,
      correlationId:message.correlationId,
      error:error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

const results = await Promise.all(peers.map((peer) => post(peer)));
console.log(JSON.stringify({
  source:N06,
  protocol:'soul-mesh/1',
  contractVersion:'1.1.0',
  endpoint:'/api/soul-mesh',
  testedAt:new Date().toISOString(),
  results,
  configured:results.filter(r=>r.configured).length,
  reachable:results.filter(r=>r.ok).length,
  totalPeers:peers.length,
}, null, 2));

process.exitCode = results.some(r => r.configured && !r.ok) ? 1 : 0;
