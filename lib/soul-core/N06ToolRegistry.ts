import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import type { Session } from 'next-auth';
import type { UIMessageStreamWriter } from 'ai';
import type { ChatMessage } from '@/lib/types';

export interface N06ToolContext { session: Session; dataStream: UIMessageStreamWriter<ChatMessage>; }

export function createN06Tools(context: N06ToolContext) {
  return {
    createDocument: createDocument(context),
    updateDocument: updateDocument(context),
    getWeather,
    requestSuggestions: requestSuggestions(context),
  };
}

export const N06_TOOL_IDS = ['createDocument', 'updateDocument', 'getWeather', 'requestSuggestions'] as const;
export type N06ToolId = (typeof N06_TOOL_IDS)[number];
