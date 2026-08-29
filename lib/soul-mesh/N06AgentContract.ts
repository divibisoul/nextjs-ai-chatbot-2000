import type { SoulMeshMessage } from './endpoint';

export type N06Agent = {
  id: string;
  name: string;
  capabilities: string[];
  execute: (message: SoulMeshMessage) => Promise<unknown> | unknown;
};
