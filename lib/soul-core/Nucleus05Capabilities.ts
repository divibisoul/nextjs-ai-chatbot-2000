export type Nucleus05Capability =
  | 'ai-pilot'
  | 'tool-execution'
  | 'artifact-processing'
  | 'document-processing'
  | 'context-orchestration'
  | 'streaming'
  | 'mesh-communication';

export const NUCLEUS_05_CAPABILITIES: readonly Nucleus05Capability[] = [
  'ai-pilot', 'tool-execution', 'artifact-processing', 'document-processing',
  'context-orchestration', 'streaming', 'mesh-communication',
] as const;

export function supportsNucleus05Capability(capability: string): capability is Nucleus05Capability {
  return (NUCLEUS_05_CAPABILITIES as readonly string[]).includes(capability);
}
