const peers = ['N01','N02','N03','N04','N05'];
const timeoutMs = Number(process.env.SOUL_MESH_TIMEOUT_MS ?? 10000);
const results = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function probe(peer) {
  const base = process.env[`SOUL_MESH_${peer}_URL`];
  if (!base) return { peer, configured:false, ok:false, reason:'URL_NOT_CONFIGURED' };
  const url = `${base.replace(/\/+$/, '')}/mesh/in`;
  const correlationId = crypto.randomUUID();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const response = await fetch(url,{method:'POST',headers:{'content-type':'application/json','x-soul-nucleus':'N06','x-soul-target':peer,'x-correlation-id':correlationId},body:JSON.stringify({protocol:'soul-mesh/1',id:crypto.randomUUID(),correlationId,source:'N06',target:peer,kind:'request',capability:'mesh.health',payload:{nucleus:'N06'},timestamp:Date.now(),nonce:crypto.randomUUID(),transport:'http'}),signal:controller.signal});
    const text = await response.text(); let payload=text; try{payload=text?JSON.parse(text):null;}catch{}
    return {peer,configured:true,ok:response.ok,status:response.status,latencyMs:Date.now()-started,correlationId,payload};
  } catch (error) { return {peer,configured:true,ok:false,latencyMs:Date.now()-started,error:String(error)}; }
  finally { clearTimeout(timer); }
}

for (const peer of peers) results.push(await probe(peer));
console.log(JSON.stringify({source:'N06',checked:peers.length,reachable:results.filter(r=>r.ok).length,results},null,2));
if(results.some(r=>r.configured && !r.ok))process.exitCode=1;
await sleep(0);
