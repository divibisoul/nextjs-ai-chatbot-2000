import crypto from 'node:crypto';

const n01 = (process.env.SOUL_MESH_N01_URL || '').replace(/\/$/, '');
const n06 = (process.env.SOUL_MESH_N06_URL || '').replace(/\/$/, '');
const secret = process.env.SOUL_MESH_HMAC_SECRET || process.env.SOUL_MESH_SECRET || '';
const token = process.env.SOUL_MESH_TOKEN || '';
if (!n01) throw new Error('SOUL_MESH_N01_URL is required');

const correlationId = crypto.randomUUID();
const nonce = crypto.randomBytes(24).toString('base64url');
const message = {
  protocol:'soul-mesh/1',
  contractVersion:'1.1.0',
  id:crypto.randomUUID(),
  correlationId,
  source:'N06',
  target:'N01',
  kind:'request',
  capability:'mesh.handshake',
  payload:{
    nucleus:'N06',
    endpoint:n06 || null,
    protocol:'soul-mesh/1',
    capabilities:['mesh.ping','mesh.health','mesh.discovery','mesh.delegate','mesh.combo'],
  },
  timestamp:Date.now(),
  transport:'HTTP',
  meta:{
    runtime:'nextjs-ai-chatbot-2000-connect-n01',
    transport:'HTTP',
    encoding:'json',
    version:'1.1.0',
    nonce,
    traceId:correlationId,
  },
};

function canonical(value) {
  return JSON.stringify({
    protocol:value.protocol,
    id:value.id,
    correlationId:value.correlationId,
    source:value.source,
    target:value.target,
    kind:value.kind,
    capability:value.capability ?? null,
    payload:value.payload,
    timestamp:value.timestamp,
    transport:value.transport ?? null,
    meta:value.meta ?? null,
    nonce,
  });
}

const headers = {
  'content-type':'application/json',
  'accept':'application/json',
  'x-soul-nucleus':'N06',
  'x-soul-target':'N01',
  'x-soul-correlation-id':correlationId,
  'x-soul-trace-id':correlationId,
};
if (secret) {
  headers['x-soul-mesh-nonce'] = nonce;
  headers['x-soul-mesh-hmac'] = crypto.createHmac('sha256', secret).update(canonical(message)).digest('hex');
} else if (token) {
  headers.authorization = `Bearer ${token}`;
}

const controller = new AbortController();
const timer = setTimeout(()=>controller.abort(), 30000);
try {
  const response = await fetch(`${n01}/api/soul-mesh`, {
    method:'POST',
    headers,
    body:JSON.stringify(message),
    signal:controller.signal,
    cache:'no-store',
  });
  const body = await response.json().catch(()=>null);
  const valid = Boolean(
    body &&
    body.protocol === message.protocol &&
    body.contractVersion === message.contractVersion &&
    body.correlationId === correlationId &&
    body.source === 'N01' &&
    body.target === 'N06' &&
    (body.kind === 'response' || body.kind === 'error')
  );
  if (!response.ok || !valid) {
    throw new Error(`N01 Mesh returned invalid response HTTP ${response.status}: ${JSON.stringify(body)}`);
  }
  console.log(JSON.stringify({
    ok: body.kind === 'response',
    source:message.source,
    target:message.target,
    protocol:message.protocol,
    contractVersion:message.contractVersion,
    correlationId,
    endpoint:'/api/soul-mesh',
    responseValid:valid,
    response:body,
  },null,2));
} finally {
  clearTimeout(timer);
}
