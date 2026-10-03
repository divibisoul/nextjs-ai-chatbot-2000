import assert from 'node:assert/strict';
import test from 'node:test';
import { executeMetaGPTProject, metaGPTConfigured } from './N06MetaGPTBridge';

function fake(status: number, body: unknown): Response { return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }); }

test('MetaGPT remote adapter preserves correlation and upstream pin', async () => {
  const oldUrl=process.env.N06_METAGPT_URL; const oldToken=process.env.N06_METAGPT_TOKEN;
  process.env.N06_METAGPT_URL='http://metagpt.test'; process.env.N06_METAGPT_TOKEN='token';
  try {
    let seen: {url:string, init:RequestInit}|undefined;
    const result=await executeMetaGPTProject({goal:'build test',maxRounds:4},'corr-metagpt',async (url,init)=>{seen={url:String(url),init:init??{}}; return fake(200,{state:'PASS',history:['ok']});}) as Record<string,unknown>;
    assert.equal(metaGPTConfigured(),true); assert.equal(seen?.url,'http://metagpt.test/execute');
    const headers=seen?.init.headers as Record<string,string>; assert.equal(headers['x-soul-correlation-id'],'corr-metagpt'); assert.equal(headers.authorization,'Bearer token');
    const body=JSON.parse(String(seen?.init.body)) as Record<string,unknown>; assert.equal(body.maxRounds,4); assert.equal(body.upstreamCommit,'11cdf466d042aece04fc6cfd13b28e1a70341b1f'); assert.equal(result.nucleus,'N06');
  } finally { if(oldUrl===undefined) delete process.env.N06_METAGPT_URL; else process.env.N06_METAGPT_URL=oldUrl; if(oldToken===undefined) delete process.env.N06_METAGPT_TOKEN; else process.env.N06_METAGPT_TOKEN=oldToken; }
});

test('MetaGPT fails closed without remote or explicitly configured local runtime', async () => {
  const oldUrl=process.env.N06_METAGPT_URL; const oldPython=process.env.N06_METAGPT_LOCAL_PYTHON;
  process.env.N06_METAGPT_URL=''; process.env.N06_METAGPT_LOCAL_PYTHON='';
  try { await assert.rejects(executeMetaGPTProject({goal:'blocked'},'corr-blocked'), /METAGPT_LOCAL/); } finally { if(oldUrl===undefined) delete process.env.N06_METAGPT_URL; else process.env.N06_METAGPT_URL=oldUrl; if(oldPython===undefined) delete process.env.N06_METAGPT_LOCAL_PYTHON; else process.env.N06_METAGPT_LOCAL_PYTHON=oldPython; }
});
