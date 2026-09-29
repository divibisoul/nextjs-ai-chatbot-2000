import{hortaCore,nervoVago,wormhole}from"./MetaConsciousnessModule";
export interface GroundingRequest{claim:string;evidence:readonly string[]}
export class SystemicGroundingModule{readonly id="systemic-grounding";private active=false;
constructor(){wormhole.register(this.id,this,{type:"engine",version:"1.0.0",capabilities:["grounding","evidence-binding","verification"],dependencies:["aeternum.consciousness.eventBus","aeternum.consciousness.hortaCore"]});nervoVago.on("grounding.activate",()=>this.activate());nervoVago.on("grounding.deactivate",()=>this.deactivate());nervoVago.on<GroundingRequest>("grounding.verify",d=>void this.verify(d))}
activate(){this.active=true;hortaCore.set(this.id+".active",true);nervoVago.emit("module.activated",{module:this.id})}deactivate(){this.active=false;hortaCore.set(this.id+".active",false);nervoVago.emit("module.deactivated",{module:this.id})}
async verify(d:GroundingRequest){if(!this.active)return;const ev=d.evidence.filter(x=>x.trim());const result={claim:d.claim.trim(),grounded:ev.length>0,evidenceCount:ev.length,timestamp:Date.now()};hortaCore.set("grounding.lastResult",result);nervoVago.emit("grounding.result",result)}}
export const systemicGroundingModule=new SystemicGroundingModule();
