import fs from 'node:fs';
import path from 'node:path';

export const OPENHANDS_CAPABILITY='software.agent.openhands@1.0.0' as const;
export const OPENHANDS_REVISION='2414d6ee5e31bede2e78211f72b58e9949575a75' as const;
export type OpenHandsState='PASS'|'FAIL'|'DEGRADED';
export interface OpenHandsEvidence{
  state:OpenHandsState;
  code?:string;
  provider:'OpenHands/OpenHands';
  revision:typeof OPENHANDS_REVISION;
  root:string;
  enabled:boolean;
  sourcePresent:boolean;
  interfaceProfile:'agent-canvas'|'unknown';
  executionProven:boolean;
}
const env=(name:string,fallback='')=>(process.env[name]??fallback).trim();
const enabled=()=>/^(1|true|yes)$/i.test(env('SOUL_N06_OPENHANDS_ENABLED'));
function config(){return {root:path.resolve(env('SOUL_N06_OPENHANDS_ROOT','integrations/soul-upstream/openhands'))};}
export function describeOpenHandsAdapter():OpenHandsEvidence{
  const c=config();
  const sourcePresent=fs.existsSync(c.root)&&fs.statSync(c.root).isDirectory();
  if(!enabled()) return {state:'DEGRADED',code:'OPENHANDS_ADAPTER_DISABLED',provider:'OpenHands/OpenHands',revision:OPENHANDS_REVISION,root:c.root,enabled:false,sourcePresent,interfaceProfile:'unknown',executionProven:false};
  if(!sourcePresent) return {state:'DEGRADED',code:'OPENHANDS_SOURCE_NOT_AVAILABLE',provider:'OpenHands/OpenHands',revision:OPENHANDS_REVISION,root:c.root,enabled:true,sourcePresent:false,interfaceProfile:'unknown',executionProven:false};
  const hasAgentCanvas=fs.existsSync(path.join(c.root,'agent-canvas'))||fs.existsSync(path.join(c.root,'agent_canvas'))||fs.existsSync(path.join(c.root,'README.md'));
  if(hasAgentCanvas) return {state:'DEGRADED',code:'OPENHANDS_AGENT_CANVAS_INTERFACE_REQUIRES_RUNTIME_BRIDGE',provider:'OpenHands/OpenHands',revision:OPENHANDS_REVISION,root:c.root,enabled:true,sourcePresent:true,interfaceProfile:'agent-canvas',executionProven:false};
  return {state:'DEGRADED',code:'OPENHANDS_PINNED_INTERFACE_UNVERIFIED',provider:'OpenHands/OpenHands',revision:OPENHANDS_REVISION,root:c.root,enabled:true,sourcePresent:true,interfaceProfile:'unknown',executionProven:false};
}
export function runOpenHands():Record<string,unknown>{
  return {...describeOpenHandsAdapter(),capability:OPENHANDS_CAPABILITY};
}
