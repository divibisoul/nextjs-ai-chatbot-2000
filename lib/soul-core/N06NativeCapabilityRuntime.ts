import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import type { Nucleus06Context } from './Nucleus05Processor';
import { nucleus06Processor } from './Nucleus05Processor';

function requireToolContext(context?: Nucleus06Context) {
  if (!context?.session || !context?.dataStream) throw new Error('N06_TOOL_CONTEXT_REQUIRED');
  return { session: context.session, dataStream: context.dataStream };
}

export function activateN06NativeCapabilities() {
  nucleus06Processor
    .registerHandler('support.artifacts', async (input, context) => {
      const value = (input && typeof input === 'object' ? input : {}) as { action?: string; title?: string; kind?: string; id?: string; description?: string };
      const toolContext = requireToolContext(context);
      if (value.action === 'update') return updateDocument(toolContext).execute?.({ id: value.id ?? '', description: value.description ?? '' });
      return createDocument(toolContext).execute?.({ title: value.title ?? 'Untitled', kind: value.kind });
    })
    .registerHandler('support.documents', async (input, context) => {
      const value = (input && typeof input === 'object' ? input : {}) as { action?: string; title?: string; kind?: string; id?: string; description?: string };
      const toolContext = requireToolContext(context);
      if (value.action === 'update') return updateDocument(toolContext).execute?.({ id: value.id ?? '', description: value.description ?? '' });
      return createDocument(toolContext).execute?.({ title: value.title ?? 'Untitled', kind: value.kind });
    })
    .registerHandler('support.context', async (input, context) => ({ input, metadata: context?.metadata ?? {}, nucleus: 'N06' }))
    .registerHandler('support.streaming', async (input, context) => {
      if (context?.dataStream) context.dataStream.write({ type: 'data-kind', data: 'n06-stream', transient: true });
      return input;
    })
    .registerHandler('support.mesh', async (input) => ({ accepted: true, protocol: 'soul-mesh/1', nucleus: 'N06', payload: input }));
  return nucleus06Processor;
}

activateN06NativeCapabilities();
