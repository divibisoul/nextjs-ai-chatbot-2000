import type { SoulMeshMessage } from './SoulMeshProtocol';

export type N06Agent = {
  id: string;
  name: string;
  capabilities: string[];
  execute: (message: SoulMeshMessage) => Promise<unknown> | unknown;
};
