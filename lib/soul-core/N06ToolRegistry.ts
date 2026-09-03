import type { Session } from 'next-auth';
import type { UIMessageStreamWriter } from 'ai';
import type { ChatMessage } from '@/lib/types';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { NUCLEUS_06_TOOL_IDS, type Nucleus06ToolId } from './N06ToolIds';

export interface N06ToolContext {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
}

/** Canonical registry for tools owned by N06. */
export function createN06Tools(context: N06ToolContext) {
  return {
    createDocument: createDocument(context),
    updateDocument: updateDocument(context),
    getWeather,
    requestSuggestions: requestSuggestions(context),
  };
}

export { NUCLEUS_06_TOOL_IDS } from './N06ToolIds';
export type { Nucleus06ToolId } from './N06ToolIds';
export type N06ToolSet = ReturnType<typeof createN06Tools>;

export const N06ToolRegistry = {
  create: createN06Tools,
  ids: NUCLEUS_06_TOOL_IDS,
} as const;
