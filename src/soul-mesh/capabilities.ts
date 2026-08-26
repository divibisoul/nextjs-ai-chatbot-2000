export const SOUL_CAPABILITIES = {
  chatTools: { id: 'chat.tools', execution: 'WEB_SESSION' as const },
  aiGeneration: { id: 'ai.generate', execution: 'WEB_SESSION' as const },
  history: { id: 'chat.history', execution: 'WEB_SESSION' as const },
};

export function soulCapability(id: string) {
  return Object.values(SOUL_CAPABILITIES).find(capability => capability.id === id);
}
