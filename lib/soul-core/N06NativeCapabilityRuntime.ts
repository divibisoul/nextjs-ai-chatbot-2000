import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import type { N06Context } from './N06Processor';
import { n06Processor } from './N06Processor';

function requireToolContext(context?: N06Context) {
  if (!context?.session || !context?.dataStream) throw new Error('N06_TOOL_CONTEXT_REQUIRED');
  return { session: context.session as any, dataStream: context.dataStream as any };
}

export function activateN06NativeCapabilities() {
  n06Processor
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
      if (context?.dataStream && typeof (context.dataStream as any).write === 'function') (context.dataStream as any).write({ type: 'data-kind', data: 'n06-stream', transient: true });
      return input;
    })
    .registerHandler('support.mesh', async (input) => ({ accepted: true, protocol: 'soul-mesh/1', nucleus: 'N06', payload: input }));
  return n06Processor;
}

activateN06NativeCapabilities();
