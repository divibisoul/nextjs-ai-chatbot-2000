export type Nucleus06Role =
  | 'support'
  | 'integration'
  | 'context'
  | 'artifacts'
  | 'documents'
  | 'tool-execution'
  | 'streaming'
  | 'mesh-communication';

/**
 * Canonical N06 capability vocabulary.
 * The support.* names describe inter-core service contracts; the legacy names
 * remain first-class compatibility identifiers so existing N06 tools/handlers
 * are not broken during the migration from the older Nucleus05 naming layer.
 */
export type Nucleus06Capability =
  | 'support.context'
  | 'support.artifacts'
  | 'support.documents'
  | 'support.tool-execution'
  | 'support.streaming'
  | 'support.mesh'
  | 'support.ai-pilot'
  | 'ai-pilot'
  | 'tool-execution'
  | 'artifact-processing'
  | 'document-processing'
  | 'context-orchestration'
  | 'streaming'
  | 'mesh-communication';

export const NUCLEUS_06_CAPABILITIES: readonly Nucleus06Capability[] = [
  'support.context',
  'support.artifacts',
  'support.documents',
  'support.tool-execution',
  'support.streaming',
  'support.mesh',
  'support.ai-pilot',
  'ai-pilot',
  'tool-execution',
  'artifact-processing',
  'document-processing',
  'context-orchestration',
  'streaming',
  'mesh-communication',
] as const;

export const NUCLEUS_06_ROLE: Nucleus06Role = 'support';

export const N06_CAPABILITY_ALIASES: Readonly<Record<string, Nucleus06Capability>> = {
  'support.context': 'context-orchestration',
  'support.artifacts': 'artifact-processing',
  'support.documents': 'document-processing',
  'support.tool-execution': 'tool-execution',
  'support.streaming': 'streaming',
  'support.mesh': 'mesh-communication',
  'support.ai-pilot': 'ai-pilot',
};

export function supportsNucleus06Capability(
  capability: string,
): capability is Nucleus06Capability {
  return (NUCLEUS_06_CAPABILITIES as readonly string[]).includes(capability);
}

export function resolveNucleus06Capability(capability: string): Nucleus06Capability | undefined {
  if (supportsNucleus06Capability(capability)) return capability;
  return N06_CAPABILITY_ALIASES[capability];
}
