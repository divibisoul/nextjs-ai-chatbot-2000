import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import type { N06Context } from './N06Processor';

export interface N06ToolContext { session: unknown; dataStream: unknown; }

export function createN06Tools(context: N06ToolContext) {
  return {
    createDocument: createDocument(context as any),
    updateDocument: updateDocument(context as any),
    getWeather,
    requestSuggestions: requestSuggestions(context as any),
  };
}

export const N06_TOOL_IDS = ['createDocument', 'updateDocument', 'getWeather', 'requestSuggestions'] as const;
export type N06ToolId = (typeof N06_TOOL_IDS)[number];
