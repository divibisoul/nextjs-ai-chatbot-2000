import type { SoulMeshMessage } from './endpoint';
import type { N06Agent } from './N06AgentContract';

export class N06AgentRegistry {
  private readonly agents = new Map<string, N06Agent>();
  register(agent: N06Agent) { this.agents.set(agent.id, agent); }
  find(capability: string) { return [...this.agents.values()].find((agent) => agent.capabilities.includes(capability)); }
  async execute(message: SoulMeshMessage) { const agent = this.find(message.capability ?? ''); if (!agent) throw new Error(`AGENT_NOT_FOUND:${message.capability ?? ''}`); return agent.execute(message); }
  describe() { return [...this.agents.values()].map(({ id, name, capabilities }) => ({ id, name, capabilities })); }
}
