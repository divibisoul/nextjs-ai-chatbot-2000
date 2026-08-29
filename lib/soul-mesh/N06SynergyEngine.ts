import { composeCapabilities, soulCapability, type SoulCapability } from './capabilities';

export interface NucleusCapabilitySnapshot {
  nucleus: string;
  capabilities: string[];
  agents: Array<{ id: string; name: string; capabilities: string[] }>;
}

export interface CapabilityFusion {
  primary: string;
  supporting: string[];
  agents: string[];
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

export function evaluateN06Fusion(snapshot: NucleusCapabilitySnapshot): CapabilityFusion[] {
  const local = [soulCapability('cognitive.synthesis'), soulCapability('support.ai-pilot')].filter(Boolean) as SoulCapability[];
  return local.flatMap(primary => {
    const remote = snapshot.capabilities.map(soulCapability).filter(Boolean) as SoulCapability[];
    const candidates = remote.filter(candidate =>
      overlap(primary.consumes ?? [], candidate.produces ?? []) > 0 ||
      overlap(primary.produces ?? [], candidate.consumes ?? []) > 0,
    );
    if (candidates.length === 0) return [];
    const supportingIds = candidates.map(candidate => candidate.id);
    const composed = composeCapabilities(primary.id, supportingIds);
    if (!composed) return [];
    const agents = agentCoverage(supportingIds, snapshot.agents);
    const dataFlow = supportingIds.reduce((total, id) => {
      const candidate = soulCapability(id);
      return total + (candidate ? overlap(primary.consumes ?? [], candidate.produces ?? []) : 0);
    }, 0);
    const agentBonus = agents.length > 0 ? 0.1 : 0;
    return [{
      primary: primary.id,
      supporting: supportingIds,
      agents,
      composed,
      score: Math.min(1, 0.5 + dataFlow * 0.2 + agentBonus),
      reasons: [
        'compatible input/output flow',
        'composition preserves existing providers',
        agents.length > 0 ? 'remote agents can execute supporting capabilities' : 'no remote agent executor declared',
      ],
    }];
  });
}
