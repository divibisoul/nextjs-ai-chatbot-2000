import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import type { Nucleus06Context } from './Nucleus05Processor';
import { nucleus06Processor } from './Nucleus05Processor';

function requireToolContext(context?: Nucleus06Context) {
  if (!context?.session || !context?.dataStream) throw new Error('N06_TOOL_CONTEXT_REQUIRED');
  return { session: context.session as any, dataStream: context.dataStream as any };
}

/** Activates capabilities through the application's existing native tools/runtime. */
export function activateN06NativeCapabilities() {
  nucleus06Processor
    .registerHandler('artifact-processing', async (input, context) => {
      const value = (input && typeof input === 'object' ? input : {}) as { action?: string; title?: string; kind?: string; id?: string; description?: string };
      const toolContext = requireToolContext(context);
      if (value.action === 'update') return updateDocument(toolContext).execute?.({ id: value.id ?? '', description: value.description ?? '' } as any);
      return createDocument(toolContext).execute?.({ title: value.title ?? 'Untitled', kind: value.kind as any } as any);
    })
    .registerHandler('document-processing', async (input, context) => {
      const value = (input && typeof input === 'object' ? input : {}) as { action?: 'create'|'update'; title?: string; kind?: string; id?: string; description?: string };
      const toolContext = requireToolContext(context);
      if (value.action === 'update') return updateDocument(toolContext).execute?.({ id: value.id ?? '', description: value.description ?? '' } as any);
      return createDocument(toolContext).execute?.({ title: value.title ?? 'Untitled', kind: value.kind as any } as any);
    })
    .registerHandler('context-orchestration', async (input, context) => ({ input, metadata: context?.metadata ?? {}, nucleus: 'N06' }))
    .registerHandler('streaming', async (input, context) => {
      if (context?.dataStream) context.dataStream.write({ type: 'data-kind', data: 'n06-stream', transient: true } as any);
      return input;
    })
    .registerHandler('mesh-communication', async (input) => ({ accepted: true, protocol: 'soul-mesh/1', nucleus: 'N06', payload: input }));

  return nucleus06Processor;
}

activateN06NativeCapabilities();
