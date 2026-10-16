import assert from 'node:assert/strict';
import test from 'node:test';
import { executeLettaMessage, executeLettaHistory, executeLettaAgentStatus, lettaStatus } from './N06LettaBridge';

function fake(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});}
test('Letta message adapter uses documented agent message endpoint and correlation',async()=>{
  const oldUrl=process.env.N06_LETTA_URL;
  const oldKey=process.env.N06_LETTA_API_KEY;
  const oldAgent=process.env.N06_LETTA_AGENT_ID;
  process.env.N06_LETTA_URL='http://letta.test'; process.env.N06_LETTA_API_KEY='key'; process.env.N06_LETTA_AGENT_ID='agent-123';
  try { let seen:any; const result=await executeLettaMessage({message:'hello',maxSteps:5},'corr-letta',async(url,init)=>{seen={url:String(url),init};return fake({messages:[{content:'ok'}]});});
    assert.equal(seen.url,'http://letta.test/v1/agents/agent-123/messages'); const h=seen.init.headers; assert.equal(h.authorization,'Bearer key'); assert.equal(h['x-soul-correlation-id'],'corr-letta');
    const body=JSON.parse(seen.init.body); assert.equal(body.input,'hello'); assert.equal(body.streaming,false); assert.equal(body.max_steps,5); assert.equal(result.provider,'letta-ai/letta');
  } finally { for(const [k,v] of Object.entries({N06_LETTA_URL:oldUrl,N06_LETTA_API_KEY:oldKey,N06_LETTA_AGENT_ID:oldAgent})) { if(v===undefined) Reflect.deleteProperty(process.env, k); else process.env[k]=v; } }
});
test('Letta invalid endpoint blocks only the provider and never breaks health discovery',()=>{
  const oldUrl=process.env.N06_LETTA_URL;
  const oldKey=process.env.N06_LETTA_API_KEY;
  const oldAgent=process.env.N06_LETTA_AGENT_ID;
  process.env.N06_LETTA_URL='not a valid endpoint';
  process.env.N06_LETTA_API_KEY='key';
  process.env.N06_LETTA_AGENT_ID='agent-123';
  try {
    const status=lettaStatus();
    assert.equal(status.state,'BLOCKED');
    assert.equal(status.configured,false);
    assert.equal(status.code,'LETTA_ENDPOINT_INVALID');
    assert.equal(status.endpoint,'invalid');
  } finally {
    for(const [k,v] of Object.entries({N06_LETTA_URL:oldUrl,N06_LETTA_API_KEY:oldKey,N06_LETTA_AGENT_ID:oldAgent})) {
      if(v===undefined) Reflect.deleteProperty(process.env,k); else process.env[k]=v;
    }
  }
});

test('Letta history and status use real REST paths',async()=>{
  const oldUrl=process.env.N06_LETTA_URL;
  const oldKey=process.env.N06_LETTA_API_KEY;
  const oldAgent=process.env.N06_LETTA_AGENT_ID;
  process.env.N06_LETTA_URL='http://letta.test'; process.env.N06_LETTA_API_KEY='key'; process.env.N06_LETTA_AGENT_ID='agent-123';
  try { const seen:string[]=[]; const fetcher=async(url:RequestInfo|URL)=>{seen.push(String(url)); return fake({ok:true});}; await executeLettaHistory({limit:7},'c1',fetcher); await executeLettaAgentStatus({},'c2',fetcher); assert.equal(seen[0],'http://letta.test/v1/agents/agent-123/messages?limit=7'); assert.equal(seen[1],'http://letta.test/v1/agents/agent-123'); } finally { for(const [k,v] of Object.entries({N06_LETTA_URL:oldUrl,N06_LETTA_API_KEY:oldKey,N06_LETTA_AGENT_ID:oldAgent})) { if(v===undefined) Reflect.deleteProperty(process.env, k); else process.env[k]=v; } }
});
