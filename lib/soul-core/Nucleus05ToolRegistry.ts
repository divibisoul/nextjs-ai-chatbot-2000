import type { Session } from 'next-auth';
import type { UIMessageStreamWriter } from 'ai';
import type { ChatMessage } from '@/lib/types';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';

export interface Nucleus05ToolContext { session: Session; dataStream: UIMessageStreamWriter<ChatMessage>; }

export function createNucleus05Tools(context: Nucleus05ToolContext) {
  return {
    createDocument: createDocument(context),
    updateDocument: updateDocument(context),
    getWeather,
    requestSuggestions: requestSuggestions(context),
  };
}

export const NUCLEUS_05_TOOL_IDS = ['createDocument', 'updateDocument', 'getWeather', 'requestSuggestions'] as const;
export type Nucleus05ToolId = (typeof NUCLEUS_05_TOOL_IDS)[number];
