import{hortaCore,nervoVago,wormhole}from"./MetaConsciousnessModule";
export interface TemporalRecord{event:string;data?:unknown;recordedAt:number}
export class TemporalConsciousnessModule{readonly id="temporal-consciousness";private active=false;private timeline:TemporalRecord[]=[];
constructor(){wormhole.register(this.id,this,{type:"engine",version:"1.0.0",capabilities:["temporal-analysis","timeline","projection-window"],dependencies:["aeternum.consciousness.eventBus","aeternum.consciousness.hortaCore"]});nervoVago.on("temporal.activate",()=>this.activate());nervoVago.on("temporal.deactivate",()=>this.deactivate());nervoVago.on<TemporalRecord>("temporal.record",d=>this.record(d));nervoVago.on<{horizonMs:number}>("temporal.project",d=>void this.project(d))}
activate(){this.active=true;hortaCore.set(this.id+".active",true);nervoVago.emit("module.activated",{module:this.id})}deactivate(){this.active=false;hortaCore.set(this.id+".active",false);nervoVago.emit("module.deactivated",{module:this.id})}
record(d:TemporalRecord){if(!d.event.trim())return;const r={...d,event:d.event.trim(),recordedAt:Date.now()};this.timeline=[...this.timeline,r].slice(-1000);hortaCore.set("temporal.timeline",this.timeline.slice(-100));nervoVago.emit("temporal.recorded",r)}
async project(d:{horizonMs:number}){if(!this.active)return;if(!Number.isFinite(d.horizonMs)||d.horizonMs<=0)return void nervoVago.emit("temporal.error",{message:"horizonMs inválido"});nervoVago.emit("temporal.projection",{horizonMs:d.horizonMs,observedRecords:this.timeline.length,latestTimestamp:this.timeline.at(-1)?.recordedAt??null,timestamp:Date.now()})}
getTimeline(){return[...this.timeline]}}
export const temporalConsciousnessModule=new TemporalConsciousnessModule();
