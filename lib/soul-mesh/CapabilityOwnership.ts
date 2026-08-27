export type NucleusId = 'N01'|'N02'|'N03'|'N04'|'N05'|'N06';
export type Ownership = { owner: NucleusId; fallback: NucleusId[] };
export const N06_OWNERSHIP: Record<string, Ownership> = {
  'cognitive.': { owner: 'N06', fallback: ['N05','N02'] },
  'tool.': { owner: 'N06', fallback: ['N04'] },
};
export function ownershipFor(capability: string): Ownership | undefined {
  return Object.entries(N06_OWNERSHIP).find(([prefix]) => capability.startsWith(prefix))?.[1];
}
