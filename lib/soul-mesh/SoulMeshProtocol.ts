export const SOUL_MESH_PROTOCOL = 'soul-mesh/1' as const;
export const SOUL_NUCLEI = ['N01','N02','N03','N04','N05','N06'] as const;
export type SoulNucleus = typeof SOUL_NUCLEI[number];
export type SoulMeshKind = 'request' | 'response' | 'event' | 'error';
export interface SoulMeshMessage<T = unknown> { protocol: typeof SOUL_MESH_PROTOCOL; id: string; correlationId: string; source: SoulNucleus; target: SoulNucleus; kind: SoulMeshKind; capability?: string; payload: T; timestamp: number; }
export interface SoulMeshTransport { send(message: SoulMeshMessage): Promise<void>; onMessage(handler: (message: SoulMeshMessage) => void | Promise<void>): () => void; }
export function createSoulMeshMessage<T>(input: Omit<SoulMeshMessage<T>, 'protocol' | 'id' | 'timestamp'>): SoulMeshMessage<T> { return { protocol: SOUL_MESH_PROTOCOL, id: crypto.randomUUID(), timestamp: Date.now(), ...input }; }
export function isSoulMeshMessage(value: unknown): value is SoulMeshMessage { if (!value || typeof value !== 'object') return false; const m = value as Record<string, unknown>; return m.protocol === SOUL_MESH_PROTOCOL && typeof m.id === 'string' && typeof m.correlationId === 'string' && (SOUL_NUCLEI as readonly string[]).includes(m.source as string) && (SOUL_NUCLEI as readonly string[]).includes(m.target as string) && m.source !== m.target && typeof m.kind === 'string' && ['request','response','event','error'].includes(m.kind); }
