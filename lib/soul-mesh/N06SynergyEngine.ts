import { composeCapabilities, soulCapability, type SoulCapability } from './capabilities';

export interface NucleusCapabilitySnapshot {
  nucleus: string;
  capabilities: string[];
  agents: Array<{ id: string; name: string; capabilities: string[] }>;
}

export interface CapabilityFusion {
  primary: string;
  supporting: string[];
  composed: SoulCapability;
  score: number;
  reasons: string[];
}

function overlap(left: string[], right: string[]): number {
  const rightSet = new Set(right);
  return left.filter(value => rightSet.has(value)).length;
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
    const dataFlow = supportingIds.reduce((total, id) => {
      const candidate = soulCapability(id);
      return total + (candidate ? overlap(primary.consumes ?? [], candidate.produces ?? []) : 0);
    }, 0);
    return [{
      primary: primary.id,
      supporting: supportingIds,
      composed,
      score: Math.min(1, 0.5 + dataFlow * 0.25),
      reasons: ['compatible input/output flow', 'composition preserves existing providers'],
    }];
  });
}
