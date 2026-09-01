import type { Session } from 'next-auth';
import type { UIMessageStreamWriter } from 'ai';
import type { ChatMessage } from '@/lib/types';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { NUCLEUS_06_TOOL_IDS, type Nucleus06ToolId } from './N06ToolIds';

export interface Nucleus06ToolContext { session: Session; dataStream: UIMessageStreamWriter<ChatMessage>; }

/** Canonical registry for tools implemented by N06. */
export function createNucleus06Tools(context: Nucleus06ToolContext) {
  return { createDocument: createDocument(context), updateDocument: updateDocument(context), getWeather, requestSuggestions: requestSuggestions(context) };
}

export { NUCLEUS_06_TOOL_IDS } from './N06ToolIds';
export type { Nucleus06ToolId } from './N06ToolIds';

/** Backward-compatible aliases for older Mesh/runtime imports. */
export const createNucleus05Tools = createNucleus06Tools;
export const NUCLEUS_05_TOOL_IDS = NUCLEUS_06_TOOL_IDS;
export type Nucleus05ToolId = Nucleus06ToolId;
