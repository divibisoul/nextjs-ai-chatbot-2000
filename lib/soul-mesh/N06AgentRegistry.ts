import type { SoulMeshMessage } from './SoulMeshProtocol';
import type { N06Agent } from './N06AgentContract';

export type AgentSelection = {
  agent: N06Agent;
  capability: string;
  rank: number;
};

export class N06AgentRegistry {
  private readonly agents = new Map<string, N06Agent>();

  register(agent: N06Agent): void {
    this.agents.set(agent.id, {
      ...agent,
      capabilities: [...new Set(agent.capabilities.filter(Boolean))],
    });
  }

  unregister(agentId: string): boolean {
    return this.agents.delete(agentId);
  }

  list(): N06Agent[] {
    return [...this.agents.values()];
  }

  findAll(capability: string): N06Agent[] {
    return this.list().filter((agent) => agent.capabilities.includes(capability));
  }

  select(capability: string): AgentSelection | undefined {
    const candidates = this.findAll(capability);
    if (candidates.length === 0) return undefined;
    return { agent: candidates[0], capability, rank: 1 };
  }

  find(capability: string): N06Agent | undefined {
    return this.select(capability)?.agent;
  }

  async execute(message: SoulMeshMessage): Promise<unknown> {
    const capability = message.capability ?? '';
    const selection = this.select(capability);
    if (!selection) throw new Error(`AGENT_NOT_FOUND:${capability}`);
    return selection.agent.execute(message);
  }

  canExecute(capability: string): boolean {
    return this.findAll(capability).length > 0;
  }

  describe(): Array<{ id: string; name: string; capabilities: string[] }> {
    return this.list().map(({ id, name, capabilities }) => ({ id, name, capabilities }));
  }
}
