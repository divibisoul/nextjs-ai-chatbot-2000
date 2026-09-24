import test from 'node:test';
import assert from 'node:assert/strict';
import { saraCycle } from './SARAClient';

test('N06 forwards optional federated context to SARA', async () => {
  process.env.SARA_BASE_URL = 'http://sara.test';
  process.env.SARA_API_TOKEN = 'token';
  const original = globalThis.fetch;
  let observed: any = null;
  globalThis.fetch = async (_input, init) => {
    observed = JSON.parse(String(init?.body ?? '{}'));
    return new Response(JSON.stringify({ cycle_id:'n06-cycle', final_state:'ok', converged:true, rollback_performed:false, execution_report:{} }), {
      status:200, headers:{'content-type':'application/json','X-Correlation-ID':'n06-corr'},
    });
  };
  try {
    await saraCycle('input','n06-corr',{session_id:'session-006',client:'app',probabilistic:{nodes:[]}});
    assert.equal(observed.context.client,'app');
    assert.deepEqual(observed.context.probabilistic.nodes,[]);
  } finally { globalThis.fetch = original; }
});
