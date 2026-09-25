import crypto from 'node:crypto';

const N06 = 'N06';
const peers = ['N01','N02','N03','N04','N05','N07'];
const timeoutMs = Number(process.env.SOUL_MESH_TIMEOUT_MS ?? 10000);
const secret = process.env.SOUL_MESH_HMAC_SECRET || process.env.SOUL_MESH_SECRET || '';
const token = process.env.SOUL_MESH_TOKEN || '';
const results = [];

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

async function probe(peer) {
  const base = (process.env[`SOUL_MESH_${peer}_URL`] || '').replace(/\/$/, '');
  if (!base) return { peer, configured:false, ok:false, reason:'URL_NOT_CONFIGURED' };

  const correlationId = crypto.randomUUID();
  const nonce = crypto.randomBytes(24).toString('base64url');
  const message = {
    protocol:'soul-mesh/1',
    contractVersion:'1.1.0',
    id:crypto.randomUUID(),
    correlationId,
    source:N06,
    target:peer,
    kind:'request',
    capability:'mesh.health',
    payload:{ nucleus:N06 },
    timestamp:Date.now(),
    transport:'HTTP',
    meta:{
      runtime:'nextjs-ai-chatbot-2000-test-all-peers',
      transport:'HTTP',
      encoding:'json',
      version:'1.1.0',
      nonce,
      traceId:correlationId,
    },
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const headers = {
      'content-type':'application/json',
      'accept':'application/json',
      'x-soul-nucleus':N06,
      'x-soul-target':peer,
      'x-soul-correlation-id':correlationId,
      'x-soul-trace-id':correlationId,
    };
    if (secret) {
      headers['x-soul-mesh-nonce'] = nonce;
      headers['x-soul-mesh-hmac'] = crypto.createHmac('sha256', secret).update(canonical(message, nonce)).digest('hex');
    } else if (token) {
      headers.authorization = `Bearer ${token}`;
    }
    const response = await fetch(`${base}/api/soul-mesh`, {
      method:'POST',
      headers,
      body:JSON.stringify(message),
      signal:controller.signal,
      cache:'no-store',
    });
    const text = await response.text();
    let payload = text;
    try { payload = text ? JSON.parse(text) : null; } catch {}
    const valid = Boolean(
      payload &&
      payload.protocol === message.protocol &&
      payload.contractVersion === message.contractVersion &&
      payload.correlationId === correlationId &&
      payload.source === peer &&
      payload.target === N06 &&
      (payload.kind === 'response' || payload.kind === 'error')
    );
    return {
      peer,
      configured:true,
      ok:response.ok && valid && payload.kind === 'response',
      status:response.status,
      latencyMs:Date.now()-started,
      correlationId,
      responseValid:valid,
      payload,
    };
  } catch (error) {
    return {
      peer,
      configured:true,
      ok:false,
      latencyMs:Date.now()-started,
      correlationId,
      error:error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

for (const peer of peers) results.push(await probe(peer));
console.log(JSON.stringify({
  source:N06,
  protocol:'soul-mesh/1',
  contractVersion:'1.1.0',
  endpoint:'/api/soul-mesh',
  checked:peers.length,
  configured:results.filter(r=>r.configured).length,
  reachable:results.filter(r=>r.ok).length,
  results,
}, null, 2));

if (results.some(r => r.configured && !r.ok)) process.exitCode = 1;
