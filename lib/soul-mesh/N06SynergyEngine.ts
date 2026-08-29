import { composeCapabilities, soulCapability, type SoulCapability } from './capabilities';

export interface NucleusCapabilitySnapshot {
  nucleus: string;
  capabilities: string[];
  agents: Array<{ id: string; name: string; capabilities: string[] }>;
  tools?: string[];
}

export interface CapabilityFusion {
  primary: string;
  supporting: string[];
  agents: string[];
  tools: string[];
  composed: SoulCapability;
  score: number;
  reasons: string[];
}

function overlap(left: string[], right: string[]): number {
  const rightSet = new Set(right);
  return left.filter(value => rightSet.has(value)).length;
}

function agentCoverage(capabilityIds: string[], agents: NucleusCapabilitySnapshot['agents']): string[] {
  return agents.filter(agent => overlap(agent.capabilities, capabilityIds) > 0).map(agent => agent.id);
}

function normalize(values: string[] = []): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

export function evaluateN06Fusion(snapshot: NucleusCapabilitySnapshot): CapabilityFusion[] {
  const local = [soulCapability('cognitive.synthesis'), soulCapability('support.ai-pilot')].filter(Boolean) as SoulCapability[];
  const remote = snapshot.capabilities.map(soulCapability).filter(Boolean) as SoulCapability[];

  return local.flatMap(primary => {
    const candidates = remote.filter(candidate =>
      overlap(primary.consumes ?? [], candidate.produces ?? []) > 0 ||
      overlap(primary.produces ?? [], candidate.consumes ?? []) > 0,
    );
    if (candidates.length === 0) return [];

    const supportingIds = normalize(candidates.map(candidate => candidate.id));
    const composed = composeCapabilities(primary.id, supportingIds);
    if (!composed) return [];

    const agents = agentCoverage(supportingIds, snapshot.agents);
    const tools = normalize(snapshot.tools);
    const dataFlow = supportingIds.reduce((total, id) => {
      const candidate = soulCapability(id);
      return total + (candidate ? overlap(primary.consumes ?? [], candidate.produces ?? []) : 0);
    }, 0);
    const agentBonus = agents.length > 0 ? 0.1 : 0;
    const toolBonus = tools.length > 0 ? 0.05 : 0;
    const score = Math.min(1, 0.5 + dataFlow * 0.2 + agentBonus + toolBonus);

    return [{
      primary: primary.id,
      supporting: supportingIds,
      agents,
      tools,
      composed,
      score,
      reasons: [
        'compatible input/output flow',
        'composition preserves existing providers',
        agents.length > 0 ? 'remote agents can execute supporting capabilities' : 'no remote agent executor declared',
        tools.length > 0 ? 'remote tools are available to the composed workflow' : 'no remote tools declared',
      ],
    }];
  });
}
