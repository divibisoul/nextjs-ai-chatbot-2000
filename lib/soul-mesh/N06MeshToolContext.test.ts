import assert from 'node:assert/strict';
import test from 'node:test';
import { createMeshToolSession } from './N06MeshToolContext';

test('N06 Mesh tool context preserves authenticated user ownership', () => {
  const session = createMeshToolSession({
    userId: 'user-123',
    source: 'N01',
    correlationId: 'corr-123',
  });

  assert.equal(session.user?.id, 'user-123');
  assert.match(session.expires, /^\d{4}-\d{2}-\d{2}T/);
});
