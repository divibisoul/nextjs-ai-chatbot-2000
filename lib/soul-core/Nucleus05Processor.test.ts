import { describe, expect, it } from 'vitest';
import { nucleus05Processor } from './Nucleus05Processor';

describe('Nucleus 05 processor', () => {
  it('exposes the required capabilities', () => {
    expect(nucleus05Processor.supports('ai-pilot')).toBe(true);
    expect(nucleus05Processor.supports('tool-execution')).toBe(true);
    expect(nucleus05Processor.supports('mesh-communication')).toBe(true);
  });

  it('rejects execution without a connected AI pilot', async () => {
    await expect(nucleus05Processor.execute({ capability: 'ai-pilot', input: 'test' })).rejects.toThrow('No AI pilot is connected');
  });
});
