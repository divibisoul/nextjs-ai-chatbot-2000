import assert from 'node:assert/strict';
import test from 'node:test';
import '@/lib/soul-core/N06NativeCapabilityRuntime';
import { NUCLEUS_06_CAPABILITIES } from './Nucleus06Capabilities';
import { n06CapabilityEngine } from './N06CapabilityEngine';

test('N06 has one executable authority for every declared capability', () => {
  const declared = [...NUCLEUS_06_CAPABILITIES];
  const executable = n06CapabilityEngine.executableCapabilities();
  const orphaned = declared.filter((capability) => !executable.includes(capability));
  assert.deepEqual(orphaned, [], `ORPHAN_CAPABILITIES:${orphaned.join(',')}`);
});

test('N06 does not expose duplicate executable registrations', () => {
  const executable = n06CapabilityEngine.listExecutables();
  const capabilities = executable.map((entry) => entry.capability);
  assert.equal(new Set(capabilities).size, capabilities.length, 'DUPLICATE_EXECUTABLE_CAPABILITIES');
});
