import { createHmac } from 'node:crypto';
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createSoulMeshNonce,
  signSoulMeshMessage,
  signSoulMeshResponse,
  verifySoulMeshMessage,
  verifySoulMeshResponse,
} from './SoulMeshHmac';
import type { SoulMeshMessage } from './SoulMeshProtocol';
import { N07NeuralBridge } from '../soul-neural/N07NeuralBridge';

const secret = '0123456789abcdef0123456789abcdef';
const hmac = (data:string) => createHmac('sha256', secret).update(data, 'utf8').digest('hex');

function request(): SoulMeshMessage {
  return {
    protocol: 'soul-mesh/1',
    contractVersion: '1.1.0',
    id: 'req-1',
    correlationId: 'corr-1',
    source: 'N06',
    target: 'N07',
    kind: 'request',
    capability: 'mesh.describe',
    payload: { probe: true },
    timestamp: Date.now(),
    transport: 'HTTP',
    meta: {
      runtime: 'nextjs-ai-chatbot-2000',
      transport: 'HTTP',
      encoding: 'json',
      version: '1.1.0',
      traceId: 'corr-1',
    },
  };
}

test('request HMAC signs and verifies with contractVersion included', () => {
  const message = request();
  const nonce = createSoulMeshNonce();
  const signature = signSoulMeshMessage(message, secret, nonce);
  assert.equal(verifySoulMeshMessage({ ...message, nonce, hmac: signature }, secret, nonce, signature), true);
  assert.equal(
    verifySoulMeshMessage({ ...message, nonce, hmac: signature.slice(0, -1) + '0' }, secret, nonce, signature.slice(0, -1) + '0'),
    false,
  );
});

test('response HMAC preserves correlation and route identity', () => {
  const message = request();
  const signed = signSoulMeshResponse(message, { ok: true }, 'response', secret);
  const response = { ...signed.message, nonce: signed.nonce, hmac: signed.hmac };
  assert.equal(response.contractVersion, '1.1.0');
  assert.equal(response.source, 'N07');
  assert.equal(response.target, 'N06');
  assert.equal(verifySoulMeshResponse(message, response, secret), true);
});

test('response HMAC rejects wrong target or correlation', () => {
  const message = request();
  const signed = signSoulMeshResponse(message, { ok: true }, 'response', secret);
  const response = { ...signed.message, nonce: signed.nonce, hmac: signed.hmac };
  assert.equal(
    verifySoulMeshResponse(message, { ...response, target: 'N05' }, secret),
    false,
  );
  assert.equal(
    verifySoulMeshResponse(message, { ...response, correlationId: 'wrong' }, secret),
    false,
  );
});

test('N06 consumes canonical N07 neural parameters with signed response', async () => {
  const old = globalThis.fetch;
  globalThis.fetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body));
    assert.equal(body.capability, 'neural.parameters');
    assert.deepEqual(body.payload, { values: [] });
    const response:any = {
      protocol:'soul-mesh/1',
      contractVersion:'1.1.0',
      id:'n07-parameters',
      correlationId:body.correlationId,
      source:'N07',
      target:'N06',
      kind:'response',
      capability:body.capability,
      payload:{},
      timestamp:Date.now(),
      metadata:{
        parameters:JSON.stringify({
          size:8,
          learning_rate:0.05,
          optimizer:'adam',
          regularization:0.000001,
          gradient_clip:1,
          heads:1,
          batch_cache:128,
          layers:[{activation:'tanh'}]
        })
      }
    };
    const nonce='response-parameters';
    const unsigned=JSON.stringify({
      version:'1.0',
      contractVersion:'1.1.0',
      messageId:response.id,
      source:'N07',
      target:'N06',
      timestamp:response.timestamp,
      nonce,
      correlationId:response.correlationId,
      type:'TASK_RESULT',
      payload:{capability:response.capability,payload:response.payload}
    });
    const sig=hmac(unsigned);
    return new Response(
      JSON.stringify({...response,nonce,hmac:sig}),
      {status:200,headers:{'content-type':'application/json','x-soul-mesh-nonce':nonce,'x-soul-mesh-hmac':sig}}
    );
  };
  try {
    const bridge=new N07NeuralBridge('N06',{baseUrl:'https://n07.test',secret});
    const params=await bridge.parameters('corr-n06-parameters');
    assert.equal(params.size,8);
    assert.equal(params.optimizer,'adam');
  } finally {
    globalThis.fetch=old;
  }
});
