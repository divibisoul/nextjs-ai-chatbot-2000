import { describe, expect, it } from 'vitest';
import '@/lib/soul-core/N06NativeCapabilityRuntime';
import { NUCLEUS_06_CAPABILITIES } from './Nucleus06Capabilities';
import { n06CapabilityEngine } from './N06CapabilityEngine';

describe('N06 capability authority', () => {
  it('has one executable authority for every declared capability', () => {
    const declared = [...NUCLEUS_06_CAPABILITIES];
    const executable = n06CapabilityEngine.executableCapabilities();
    const orphaned = declared.filter((capability) => !executable.includes(capability));
    expect(orphaned, `ORPHAN_CAPABILITIES:${orphaned.join(',')}`).toEqual([]);
  });

  it('does not expose duplicate executable registrations', () => {
    const executable = n06CapabilityEngine.listExecutables();
    const capabilities = executable.map((entry) => entry.capability);
    expect(new Set(capabilities).size).toBe(capabilities.length);
    expect(executable.length).toBe(new Set(capabilities).size);
  });
});
