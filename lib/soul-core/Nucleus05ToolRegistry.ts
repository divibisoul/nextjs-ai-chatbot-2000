import type { Session } from 'next-auth';
import type { UIMessageStreamWriter } from 'ai';
import type { ChatMessage } from '@/lib/types';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';

export interface Nucleus06ToolContext { session: Session; dataStream: UIMessageStreamWriter<ChatMessage>; }

/** Canonical registry for tools implemented by N06. */
export function createNucleus06Tools(context: Nucleus06ToolContext) {
  return { createDocument: createDocument(context), updateDocument: updateDocument(context), getWeather, requestSuggestions: requestSuggestions(context) };
}

export const NUCLEUS_06_TOOL_IDS = ['createDocument', 'updateDocument', 'getWeather', 'requestSuggestions'] as const;
export type Nucleus06ToolId = (typeof NUCLEUS_06_TOOL_IDS)[number];

/** Backward-compatible aliases for older Mesh/runtime imports. */
export const createNucleus05Tools = createNucleus06Tools;
export const NUCLEUS_05_TOOL_IDS = NUCLEUS_06_TOOL_IDS;
export type Nucleus05ToolId = Nucleus06ToolId;
