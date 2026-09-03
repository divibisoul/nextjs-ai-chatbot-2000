import { NUCLEUS_06_CAPABILITIES, type Nucleus06Capability } from './Nucleus06Capabilities';

export interface N06EngineContext {
  session?: unknown;
  dataStream?: unknown;
  metadata?: Record<string, unknown>;
}

export type N06EngineHandler = (input: unknown, context?: N06EngineContext) => Promise<unknown>;

export interface N06EnginePilot {
  id: string;
  execute(input: unknown, context?: N06EngineContext): Promise<unknown>;
}

type N06Executable = {
  kind: 'handler' | 'agent';
  id: string;
  execute: N06EngineHandler;
};

const LEGACY_TO_CANONICAL: Record<string, Nucleus06Capability> = {
  'ai-pilot': 'support.ai-pilot',
  'tool-execution': 'support.tool-execution',
  'artifact-processing': 'support.artifacts',
  'document-processing': 'support.documents',
  'context-orchestration': 'support.context',
  streaming: 'support.streaming',
  'mesh-communication': 'support.mesh',
};

function normalizeCapability(capability: string): Nucleus06Capability | undefined {
  if ((NUCLEUS_06_CAPABILITIES as readonly string[]).includes(capability)) return capability as Nucleus06Capability;
  return LEGACY_TO_CANONICAL[capability];
}

export class N06CapabilityEngine {
  readonly id = 'nucleus-06-capability-engine' as const;
  readonly capabilities = NUCLEUS_06_CAPABILITIES;
  private readonly executables = new Map<Nucleus06Capability, N06Executable>();

  registerHandler(capability: Nucleus06Capability, handler: N06EngineHandler): this {
    if (!capability.trim()) throw new Error('N06_CAPABILITY_REQUIRED');
    if (this.executables.has(capability)) throw new Error(`N06_CAPABILITY_ALREADY_REGISTERED:${capability}`);
    this.executables.set(capability, { kind: 'handler', id: capability, execute: handler });
    return this;
  }

  registerPilot(pilot: N06EnginePilot): this {
    if (!pilot.id.trim()) throw new Error('N06_PILOT_ID_REQUIRED');
    const capability: Nucleus06Capability = 'support.ai-pilot';
    if (this.executables.has(capability)) throw new Error('N06_AI_PILOT_ALREADY_REGISTERED');
    this.executables.set(capability, { kind: 'agent', id: pilot.id, execute: pilot.execute });
    return this;
  }

  getPilot(): N06EnginePilot | undefined {
    const executable = this.executables.get('support.ai-pilot');
    if (!executable || executable.kind !== 'agent') return undefined;
    return { id: executable.id, execute: executable.execute };
  }

  listHandlers(): Nucleus06Capability[] {
    return [...this.executables.entries()].filter(([, executable]) => executable.kind === 'handler').map(([capability]) => capability);
  }

  listExecutables(): Array<{ capability: Nucleus06Capability; kind: N06Executable['kind']; id: string }> {
    return [...this.executables.entries()].map(([capability, executable]) => ({ capability, kind: executable.kind, id: executable.id }));
  }

  executableCapabilities(): Nucleus06Capability[] { return [...this.executables.keys()]; }

  supports(capability: string): boolean {
    const canonical = normalizeCapability(capability);
    return canonical !== undefined && this.executables.has(canonical);
  }

  async execute(capability: string, input: unknown, context?: N06EngineContext): Promise<unknown> {
    const canonical = normalizeCapability(capability);
    if (!canonical) throw new Error(`N06_UNSUPPORTED_CAPABILITY:${capability}`);
    const executable = this.executables.get(canonical);
    if (!executable) throw new Error(`N06_CAPABILITY_HANDLER_NOT_REGISTERED:${canonical}`);
    return executable.execute(input, context);
  }
}

export const n06CapabilityEngine = new N06CapabilityEngine();
