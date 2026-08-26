export type SoulMeshCapability = { id: string; version: string; description: string; request: boolean; response: boolean; events: boolean };

export const SOUL_MESH_CAPABILITIES: SoulMeshCapability[] = [
  { id: 'ai-pilot', version: '1.0', description: 'Provider-agnostic AI pilot boundary', request: true, response: true, events: true },
  { id: 'tool-execution', version: '1.0', description: 'Execution of registered Nucleus 05 tools', request: true, response: true, events: true },
  { id: 'artifact-processing', version: '1.0', description: 'Artifact creation and processing', request: true, response: true, events: true },
  { id: 'document-processing', version: '1.0', description: 'Document creation and updates', request: true, response: true, events: true },
  { id: 'context-orchestration', version: '1.0', description: 'Conversation and execution context', request: true, response: true, events: true },
  { id: 'streaming', version: '1.0', description: 'Streaming AI/tool results', request: true, response: true, events: true },
  { id: 'mesh-communication', version: '1.0', description: 'Soul Mesh communication', request: true, response: true, events: true },
];
