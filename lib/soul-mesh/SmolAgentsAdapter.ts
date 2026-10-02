import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

export const SMOLAGENTS_CAPABILITY='software.agent.smolagents@1.0.0' as const;
export const SMOLAGENTS_REVISION='c30b115286e000e98711fae5e85993547b73d826' as const;
export type SmolAgentsState='PASS'|'FAIL'|'DEGRADED';

export interface SmolAgentsRequest {
  task:string;
  modelId?:string;
  provider?:string;
  maxSteps?:number;
  executorType?:'docker'|'e2b'|'modal'|'blaxel';
}

export interface SmolAgentsEvidence {
  state:SmolAgentsState;
  code?:string;
  provider:'huggingface/smolagents';
  revision:typeof SMOLAGENTS_REVISION;
  root:string;
  python:string;
  enabled:boolean;
  sourcePresent:boolean;
  modelId:string;
  modelProvider:string;
  tokenPresent:boolean;
  executorType:string;
}

const env=(name:string,fallback='')=>(process.env[name]??fallback).trim();
const enabled=()=>/^(1|true|yes)$/i.test(env('SOUL_N06_SMOLAGENTS_ENABLED'));
function config(){
  return {
    python:env('SOUL_N06_SMOLAGENTS_PYTHON','python3'),
    root:path.resolve(env('SOUL_N06_SMOLAGENTS_ROOT','integrations/soul-upstream/smolagents')),
    modelId:env('SOUL_N06_SMOLAGENTS_MODEL_ID','Qwen/Qwen3-Next-80B-A3B-Thinking'),
    provider:env('SOUL_N06_SMOLAGENTS_MODEL_PROVIDER','auto'),
    executorType:env('SOUL_N06_SMOLAGENTS_EXECUTOR','docker'),
    timeoutMs:Math.max(10000,Number.parseInt(env('SOUL_N06_SMOLAGENTS_TIMEOUT_MS','180000'),10)||180000),
  };
}
export function describeSmolAgentsAdapter():SmolAgentsEvidence{
  const c=config();
  const sourcePresent=fs.existsSync(c.root)&&fs.statSync(c.root).isDirectory();
  const tokenPresent=Boolean(env('HF_TOKEN'));
  if(!enabled())return {state:'DEGRADED',code:'SMOLAGENTS_ADAPTER_DISABLED',provider:'huggingface/smolagents',revision:SMOLAGENTS_REVISION,root:c.root,python:c.python,enabled:false,sourcePresent,modelId:c.modelId,modelProvider:c.provider,tokenPresent,executorType:c.executorType};
  if(!sourcePresent)return {state:'DEGRADED',code:'SMOLAGENTS_SOURCE_NOT_AVAILABLE',provider:'huggingface/smolagents',revision:SMOLAGENTS_REVISION,root:c.root,python:c.python,enabled:true,sourcePresent:false,modelId:c.modelId,modelProvider:c.provider,tokenPresent,executorType:c.executorType};
  if(!tokenPresent)return {state:'DEGRADED',code:'SMOLAGENTS_HF_TOKEN_NOT_AVAILABLE',provider:'huggingface/smolagents',revision:SMOLAGENTS_REVISION,root:c.root,python:c.python,enabled:true,sourcePresent:true,modelId:c.modelId,modelProvider:c.provider,tokenPresent:false,executorType:c.executorType};
  if(!['docker','e2b','modal','blaxel'].includes(c.executorType))return {state:'FAIL',code:'SMOLAGENTS_EXECUTOR_UNSUPPORTED',provider:'huggingface/smolagents',revision:SMOLAGENTS_REVISION,root:c.root,python:c.python,enabled:true,sourcePresent:true,modelId:c.modelId,modelProvider:c.provider,tokenPresent:true,executorType:c.executorType};
  return {state:'DEGRADED',code:'SMOLAGENTS_EXECUTION_NOT_YET_PROVEN',provider:'huggingface/smolagents',revision:SMOLAGENTS_REVISION,root:c.root,python:c.python,enabled:true,sourcePresent:true,modelId:c.modelId,modelProvider:c.provider,tokenPresent:true,executorType:c.executorType};
}
export async function runSmolAgents(request:SmolAgentsRequest):Promise<Record<string,unknown>>{
  const evidence=describeSmolAgentsAdapter();
  if(evidence.state!=='PASS'&&evidence.code!=='SMOLAGENTS_EXECUTION_NOT_YET_PROVEN')return {...evidence,capability:SMOLAGENTS_CAPABILITY};
  const task=request.task.trim();
  if(!task)return {state:'FAIL',code:'SMOLAGENTS_TASK_REQUIRED',capability:SMOLAGENTS_CAPABILITY,...evidence};
  const c=config();
  const payload=JSON.stringify({root:c.root,modelId:request.modelId?.trim()||c.modelId,provider:request.provider?.trim()||c.provider,task, maxSteps:Math.min(100,Math.max(1,request.maxSteps??20)),executorType:request.executorType??c.executorType});
  const child=spawn(c.python,[path.resolve('scripts/smolagents_runner.py')],{cwd:process.cwd(),stdio:['pipe','pipe','pipe']});
  let stdout='',stderr='';child.stdout.setEncoding('utf8');child.stderr.setEncoding('utf8');child.stdout.on('data',x=>stdout+=x);child.stderr.on('data',x=>stderr+=x);
  const result=await new Promise<{code:number|null;signal:NodeJS.Signals|null}>((resolve,reject)=>{
    const timer=setTimeout(()=>{child.kill('SIGTERM');reject(new Error('SMOLAGENTS_TIMEOUT'));},c.timeoutMs);
    child.once('error',e=>{clearTimeout(timer);reject(e)});child.once('exit',(code,signal)=>{clearTimeout(timer);resolve({code,signal})});child.stdin.end(payload);
  }).catch(error=>({code:null,signal:null,error}));
  if('error'in result&&result.error){const message=result.error instanceof Error?result.error.message:String(result.error);return {state:message==='SMOLAGENTS_TIMEOUT'?'FAIL':'DEGRADED',code:message==='SMOLAGENTS_TIMEOUT'?'SMOLAGENTS_TIMEOUT':'SMOLAGENTS_PROCESS_UNAVAILABLE',detail:message,stderr:stderr.slice(-4000),capability:SMOLAGENTS_CAPABILITY,...evidence};}
  if(result.code!==0)return {state:'FAIL',code:'SMOLAGENTS_PROCESS_FAILED',exitCode:result.code,signal:result.signal,stderr:stderr.slice(-4000),capability:SMOLAGENTS_CAPABILITY,...evidence};
  try{return {...JSON.parse(stdout.trim()),capability:SMOLAGENTS_CAPABILITY,providerRevision:SMOLAGENTS_REVISION};}
  catch{return {state:'FAIL',code:'SMOLAGENTS_INVALID_RUNNER_OUTPUT',stdout:stdout.slice(-4000),stderr:stderr.slice(-4000),capability:SMOLAGENTS_CAPABILITY,...evidence};}
}
