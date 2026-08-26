export type NucleusId = 'N01' | 'N02' | 'N03' | 'N04' | 'N05' | 'N06';

export type AffinityDomain =
  | 'android'
  | 'ai'
  | 'knowledge'
  | 'tools'
  | 'documents'
  | 'artifacts'
  | 'context'
  | 'communication';

export interface Nucleus06Affinity {
  nucleus: NucleusId;
  domains: readonly AffinityDomain[];
  role: 'consume' | 'support' | 'bridge';
}

/**
 * N06 is an integral support nucleus. It complements capabilities owned by
 * other nuclei; it does not clone their implementations.
 */
export const NUCLEUS_06_AFFINITY: readonly Nucleus06Affinity[] = [
  { nucleus: 'N01', domains: ['android', 'communication'], role: 'bridge' },
  { nucleus: 'N02', domains: ['ai', 'tools', 'documents', 'context'], role: 'support' },
  { nucleus: 'N03', domains: ['knowledge', 'context'], role: 'support' },
  { nucleus: 'N04', domains: ['ai', 'tools', 'communication'], role: 'support' },
  { nucleus: 'N05', domains: ['ai', 'tools', 'documents', 'artifacts', 'context', 'communication'], role: 'support' },
  { nucleus: 'N06', domains: ['context', 'documents', 'artifacts', 'tools', 'communication'], role: 'support' },
] as const;

export function affinityFor(nucleus: NucleusId): Nucleus06Affinity {
  return NUCLEUS_06_AFFINITY.find((entry) => entry.nucleus === nucleus)!;
}
