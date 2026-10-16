import type { N06Context } from './N06Processor';

const UPSTREAM_COMMIT = '5bcdd177d70fa2b31a754cfcd801e77b2e1ab16a';
const DEFAULT_URL = 'http://localhost:8283';
const DEFAULT_AGENT_ID = '';

type FetchLike = typeof fetch;
function env(name: string): string { return String(process.env[name] ?? '').trim(); }
function required(value: unknown, code: string): string { const s=String(value ?? '').trim(); if(!s) throw new Error(code); return s; }
function baseUrl(): string {
  const raw=env('N06_LETTA_URL') || DEFAULT_URL;
  try { const u=new URL(raw); if(!/^https?:$/.test(u.protocol)) throw new Error(); return u.toString().replace(/\/$/,''); } catch { throw new Error('LETTA_ENDPOINT_INVALID'); }
}
function authHeaders(correlationId: string): Record<string,string> {
  const apiKey=env('N06_LETTA_API_KEY');
  if(!apiKey) throw new Error('LETTA_API_KEY_NOT_CONFIGURED');
  if(!correlationId.trim()) throw new Error('LETTA_CORRELATION_REQUIRED');
  return { authorization:`Bearer ${apiKey}`, accept:'application/json', 'x-soul-correlation-id':correlationId, 'x-soul-upstream-commit':UPSTREAM_COMMIT };
}
async function request(path:string, init:RequestInit, fetchImpl:FetchLike):Promise<Record<string,unknown>>{
  const response=await fetchImpl(`${baseUrl()}${path}`,init);
  const raw=await response.text(); let payload:unknown;
  try{payload=raw?JSON.parse(raw):{};}catch{throw new Error('LETTA_RESPONSE_JSON_INVALID');}
  if(!payload || typeof payload!=='object' || Array.isArray(payload)) throw new Error('LETTA_RESPONSE_OBJECT_REQUIRED');
  if(!response.ok) throw new Error(`LETTA_HTTP_${response.status}`);
  return payload as Record<string,unknown>;
}
export function lettaStatus(){return {provider:'letta-ai/letta',upstreamCommit:UPSTREAM_COMMIT,endpoint:baseUrl(),agentId:env('N06_LETTA_AGENT_ID')||DEFAULT_AGENT_ID,configured:Boolean(env('N06_LETTA_API_KEY')&&env('N06_LETTA_AGENT_ID')),state:env('N06_LETTA_API_KEY')&&env('N06_LETTA_AGENT_ID')?'CONFIGURED':'BLOCKED'};}
export async function executeLettaMessage(input:unknown,correlationId:string,fetchImpl:FetchLike=fetch,context?:N06Context){
  if(!input || typeof input!=='object' || Array.isArray(input)) throw new Error('LETTA_INPUT_MUST_BE_OBJECT');
  const v=input as Record<string,unknown>; const agentId=required(v.agentId||env('N06_LETTA_AGENT_ID'),'LETTA_AGENT_ID_REQUIRED'); const message=required(v.message??v.input,'LETTA_MESSAGE_REQUIRED');
  const body:Record<string,unknown>={input:message,streaming:false}; if(v.maxSteps!==undefined) body.max_steps=Math.max(1,Math.min(200,Number(v.maxSteps)));
  const payload=await request(`/v1/agents/${encodeURIComponent(agentId)}/messages`,{method:'POST',headers:{...authHeaders(correlationId),'content-type':'application/json'},body:JSON.stringify(body)},fetchImpl);
  return {nucleus:'N06',provider:'letta-ai/letta',upstreamCommit:UPSTREAM_COMMIT,agentId,correlationId,contextMetadata:context?.metadata??{},payload};
}
export async function executeLettaHistory(input:unknown,correlationId:string,fetchImpl:FetchLike=fetch,context?:N06Context){
  if(!input || typeof input!=='object' || Array.isArray(input)) throw new Error('LETTA_INPUT_MUST_BE_OBJECT');
  const v=input as Record<string,unknown>; const agentId=required(v.agentId||env('N06_LETTA_AGENT_ID'),'LETTA_AGENT_ID_REQUIRED');
  const limit=Math.max(1,Math.min(100,Math.trunc(Number(v.limit??20)||20)));
  const payload=await request(`/v1/agents/${encodeURIComponent(agentId)}/messages?limit=${limit}`,{method:'GET',headers:authHeaders(correlationId)},fetchImpl);
  return {nucleus:'N06',provider:'letta-ai/letta',upstreamCommit:UPSTREAM_COMMIT,agentId,correlationId,contextMetadata:context?.metadata??{},payload};
}
export async function executeLettaAgentStatus(input:unknown,correlationId:string,fetchImpl:FetchLike=fetch,context?:N06Context){
  const value=input&&typeof input==='object'&&!Array.isArray(input)?input as Record<string,unknown>:{}; const agentId=required(value.agentId||env('N06_LETTA_AGENT_ID'),'LETTA_AGENT_ID_REQUIRED');
  const payload=await request(`/v1/agents/${encodeURIComponent(agentId)}`,{method:'GET',headers:authHeaders(correlationId)},fetchImpl);
  return {nucleus:'N06',provider:'letta-ai/letta',upstreamCommit:UPSTREAM_COMMIT,agentId,correlationId,contextMetadata:context?.metadata??{},payload};
}