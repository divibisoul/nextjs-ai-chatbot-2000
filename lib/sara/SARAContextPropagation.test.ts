import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSaraCycleBody } from './SARAClient';

test('N06 SARA request carries session and pipeline context without changing correlation', () => {
  const body = buildSaraCycleBody('input', 'n06-corr', {
    session_id: 'session-006',
    client: 'app',
    pipeline: { selected_chat_model: 'chat-model' },
    probabilistic: { observed: true },
  });

  assert.equal(body.input, 'input');
  assert.equal(body.cycle_id, 'n06-corr');
  assert.deepEqual(body.context, {
    session_id: 'session-006',
    client: 'app',
    pipeline: { selected_chat_model: 'chat-model' },
    probabilistic: { observed: true },
  });
});

test('N06 SARA context defaults the client only when caller omitted it', () => {
  const body = buildSaraCycleBody('input', 'corr-2', { session_id: 'session-2' });
  assert.equal((body.context as Record<string, unknown>).client, 'n06');
});
