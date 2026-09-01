/**
 * Compatibility facade for the historical Nucleus05 filename.
 * N06Processor remains the single canonical runtime; this facade only translates
 * the legacy capability names used by older callers into canonical N06 names.
 */
import { n06Processor } from './N06Processor';
import type { Nucleus06Capability } from './Nucleus06Capabilities';

const LEGACY_CAPABILITIES = {
  'ai-pilot': 'support.ai-pilot',
  'tool-execution': 'support.tool-execution',
  'mesh-communication': 'support.mesh',
  context: 'support.context',
  artifacts: 'support.artifacts',
  documents: 'support.documents',
  streaming: 'support.streaming',
} as const;

type LegacyCapability = keyof typeof LEGACY_CAPABILITIES;

const canonical = (capability: string): Nucleus06Capability | undefined =>
  LEGACY_CAPABILITIES[capability as LegacyCapability] ??
  (n06Processor.supports(capability) ? capability : undefined);

export const nucleus05Processor = {
  ...n06Processor,
  supports(capability: string): boolean {
    return canonical(capability) !== undefined;
  },
  async execute(request: { capability: string; input: unknown }, context?: Parameters<typeof n06Processor.execute>[1]) {
    const mapped = canonical(request.capability);
    if (!mapped) throw new Error(`Unsupported Nucleus 05 capability: ${request.capability}`);
    try {
      return await n06Processor.execute({ capability: mapped, input: request.input }, context);
    } catch (error) {
      if (request.capability === 'ai-pilot' && error instanceof Error && error.message === 'No AI pilot is connected to Nucleus 06') {
        throw new Error('No AI pilot is connected to Nucleus 05');
      }
      throw error;
    }
  },
};

export { n06Processor as nucleus06Processor } from './N06Processor';
export { N06Processor as Nucleus05Processor } from './N06Processor';
export type {
  N06Context as Nucleus06Context,
  N06Context as Nucleus05Context,
  N06Request as Nucleus06Request,
  N06Request as Nucleus05Request,
  N06Pilot as Nucleus06Pilot,
  N06Pilot as Nucleus05Pilot,
  N06Handler as Nucleus06Handler,
  N06Handler as Nucleus05Handler,
} from './N06Processor';
