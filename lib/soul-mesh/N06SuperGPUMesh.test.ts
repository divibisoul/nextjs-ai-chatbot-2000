import { describe, expect, it } from 'vitest';
import { requestN07SuperGPU } from './N06SuperGPUMesh';

describe('N06 SuperGPU Mesh client', () => {
  it('fails closed on non-finite input', async () => {
    await expect(requestN07SuperGPU([Number.NEGATIVE_INFINITY])).rejects.toThrow('SUPERGPU_VALUES_INVALID');
  });
  it('fails closed on empty operation', async () => {
    await expect(requestN07SuperGPU([1], '  ')).rejects.toThrow('SUPERGPU_OPERATION_REQUIRED');
  });
});
