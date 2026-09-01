export const NUCLEUS_06_TOOL_IDS = [
  'createDocument',
  'updateDocument',
  'getWeather',
  'requestSuggestions',
] as const;

export type Nucleus06ToolId = (typeof NUCLEUS_06_TOOL_IDS)[number];
