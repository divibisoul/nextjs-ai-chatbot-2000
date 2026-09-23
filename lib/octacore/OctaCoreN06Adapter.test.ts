import assert from 'node:assert/strict';
import test from 'node:test';
import { executeOctaCoreN06 } from './OctaCoreN06Adapter';

test('N06 Octacore adapter executes declared context capability and preserves correlation', async () => {
  const result = await executeOctaCoreN06({
    capability: 'support.context',
    payload: { phase: 'RESEARCH', parallel_group: 'pre' },
    job_id: 'octa-n06-1',
    correlation_id: 'corr-n06-1',
  });
  assert.equal(result.ok, true);
  assert.equal(result.nucleus, 'N06');
  assert.equal(result.capability, 'support.context');
  assert.equal(result.correlationId, 'corr-n06-1');
});

test('N06 Octacore adapter rejects undeclared capability explicitly', async () => {
  await assert.rejects(
    executeOctaCoreN06({ capability: 'research.execute', payload: {}, correlation_id: 'corr-n06-2' }),
    /OCTACORE_N06_CAPABILITY_NOT_DECLARED:/,
  );
});
