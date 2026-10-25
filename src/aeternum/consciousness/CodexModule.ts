import{hortaCore,nervoVago,wormhole}from"./MetaConsciousnessModule";
export interface CodexEntry{value:unknown;storedAt:number}
export class CodexModule{readonly id="codex";private active=false;private entries=new Map<string,CodexEntry>();
constructor(){wormhole.register(this.id,this,{type:"engine",version:"1.0.0",capabilities:["knowledge-storage","lookup","expansion"],dependencies:["aeternum.consciousness.eventBus","aeternum.consciousness.hortaCore"]});nervoVago.on("codex.activate",()=>this.activate());nervoVago.on("codex.deactivate",()=>this.deactivate());nervoVago.on<{key:string;value:unknown}>("codex.store",d=>this.store(d));nervoVago.on<{key:string}>("codex.lookup",d=>this.lookup(d))}
activate(){this.active=true;hortaCore.set(this.id+".active",true);nervoVago.emit("module.activated",{module:this.id})}deactivate(){this.active=false;hortaCore.set(this.id+".active",false);nervoVago.emit("module.deactivated",{module:this.id})}
store(d:{key:string;value:unknown}){if(!d.key.trim())return;const e={value:d.value,storedAt:Date.now()};this.entries.set(d.key,e);hortaCore.set("codex."+d.key,e);nervoVago.emit("codex.stored",{key:d.key,storedAt:e.storedAt})}
lookup(d:{key:string}){if(!this.active)return;const entry=this.entries.get(d.key)??hortaCore.get<CodexEntry>("codex."+d.key);nervoVago.emit("codex.result",{key:d.key,entry,found:entry!==undefined})}
listKeys(){return[...this.entries.keys()].sort()}}
export const codexModule=new CodexModule();
