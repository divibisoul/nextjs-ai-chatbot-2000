export const N06_CAPABILITIES = [
  'mesh.ping',
  'mesh.describe',
  'capability-discovery',
  'ai-pilot',
  'cognitive.reason',
  'context-orchestration',
  'tool-execution',
  'mesh-communication',
] as const;

export type N06Capability = typeof N06_CAPABILITIES[number];

export function supportsN06Capability(value: string): value is N06Capability {
  return (N06_CAPABILITIES as readonly string[]).includes(value);
}
