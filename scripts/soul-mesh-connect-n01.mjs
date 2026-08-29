import crypto from 'node:crypto';

const n01 = (process.env.SOUL_MESH_N01_URL || '').replace(/\/$/, '');
const n06 = (process.env.SOUL_MESH_N06_URL || '').replace(/\/$/, '');
if (!n01) throw new Error('SOUL_MESH_N01_URL is required');

const id = crypto.randomUUID();
const base = { version:'1.0', messageId:crypto.randomUUID(), source:'N06', target:'N01', timestamp:Date.now(), nonce:crypto.randomUUID(), correlationId:id, type:'CAPABILITY_REQUEST', payload:{capability:'mesh.register', payload:{nucleus:'N06',endpoint:n06||null,protocol:'soul-mesh/1',capabilities:['mesh.ping','mesh.health','mesh.discovery','mesh.delegate','mesh.combo']}} };
const secret = process.env.SOUL_MESH_SECRET;
const unsigned = JSON.stringify(base);
const message = {...base, hmac: secret ? crypto.createHmac('sha256', secret).update(unsigned).digest('hex') : ''};

const controller = new AbortController();
const timer = setTimeout(()=>controller.abort(), 30000);
try {
  const response = await fetch(`${n01}/mesh/in`, {method:'POST',headers:{'content-type':'application/json','x-soul-nucleus':'N06','x-soul-target':'N01','x-correlation-id':id},body:JSON.stringify(message),signal:controller.signal});
  const body = await response.json().catch(()=>null);
  if (!response.ok) throw new Error(`N01 returned HTTP ${response.status}: ${JSON.stringify(body)}`);
  console.log(JSON.stringify({ok:true,source:message.source,target:message.target,correlationId:id,response:body},null,2));
} finally { clearTimeout(timer); }
