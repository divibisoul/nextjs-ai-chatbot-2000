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
  private readonly handlers = new Map<Nucleus06Capability, N06EngineHandler>();
  private pilot?: N06EnginePilot;

  registerHandler(capability: Nucleus06Capability, handler: N06EngineHandler): this {
    if (!capability.trim()) throw new Error('N06_CAPABILITY_REQUIRED');
    if (this.handlers.has(capability)) throw new Error(`N06_CAPABILITY_HANDLER_ALREADY_REGISTERED:${capability}`);
    this.handlers.set(capability, handler);
    return this;
  }

  registerPilot(pilot: N06EnginePilot): this {
    if (!pilot.id.trim()) throw new Error('N06_PILOT_ID_REQUIRED');
    this.pilot = pilot;
    return this;
  }

  getPilot(): N06EnginePilot | undefined { return this.pilot; }
  listHandlers(): Nucleus06Capability[] { return [...this.handlers.keys()]; }

  executableCapabilities(): Nucleus06Capability[] {
    return [...this.capabilities].filter((capability) => capability === 'support.ai-pilot' ? Boolean(this.pilot) || this.handlers.has(capability) : this.handlers.has(capability));
  }

  supports(capability: string): boolean {
    const canonical = normalizeCapability(capability);
    return canonical !== undefined && this.executableCapabilities().includes(canonical);
  }

  async execute(capability: string, input: unknown, context?: N06EngineContext): Promise<unknown> {
    const canonical = normalizeCapability(capability);
    if (!canonical) throw new Error(`N06_UNSUPPORTED_CAPABILITY:${capability}`);
    if (canonical === 'support.ai-pilot' && this.pilot) return this.pilot.execute(input, context);
    const handler = this.handlers.get(canonical);
    if (!handler) throw new Error(`N06_CAPABILITY_HANDLER_NOT_REGISTERED:${canonical}`);
    return handler(input, context);
  }
}

export const n06CapabilityEngine = new N06CapabilityEngine();
