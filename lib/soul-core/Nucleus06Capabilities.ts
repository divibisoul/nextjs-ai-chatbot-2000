export type Nucleus06Role =
  | 'support'
  | 'integration'
  | 'context'
  | 'artifacts'
  | 'documents'
  | 'tool-execution'
  | 'streaming'
  | 'mesh-communication';

export type Nucleus06Capability =
  | 'support.context'
  | 'support.artifacts'
  | 'support.documents'
  | 'support.tool-execution'
  | 'support.streaming'
  | 'support.mesh'
  | 'support.ai-pilot'
  | 'superagi.agent.create'
  | 'superagi.agent.run'
  | 'superagi.agent.run-status'
  | 'superagi.agent.pause'
  | 'superagi.agent.resume'
  | 'superagi.agent.update'
  | 'metagpt.project.run'
  | 'metagpt.project.status'
  | 'letta.agent.message'
  | 'letta.agent.history'
  | 'letta.agent.status'
  | 'external.capability.resolve@1.0.0'
  | 'external.capability.fabric.describe@1.0.0';

export const NUCLEUS_06_CAPABILITIES: readonly Nucleus06Capability[] = [
  'support.context',
  'support.artifacts',
  'support.documents',
  'support.tool-execution',
  'support.streaming',
  'support.mesh',
  'support.ai-pilot',
  'superagi.agent.create',
  'superagi.agent.run',
  'superagi.agent.run-status',
  'superagi.agent.pause',
  'superagi.agent.resume',
  'superagi.agent.update',
  'metagpt.project.run',
  'metagpt.project.status',
  'letta.agent.message',
  'letta.agent.history',
  'letta.agent.status',
  'external.capability.resolve@1.0.0',
  'external.capability.fabric.describe@1.0.0',
] as const;

export const NUCLEUS_06_ROLE: Nucleus06Role = 'support';

export function supportsNucleus06Capability(
  capability: string,
): capability is Nucleus06Capability {
  return (NUCLEUS_06_CAPABILITIES as readonly string[]).includes(capability);
}
