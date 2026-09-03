#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const processorPath = path.join(ROOT, 'lib/soul-core/N06Processor.ts');
const runtimePath = path.join(ROOT, 'lib/soul-mesh/Nucleus06CapabilityRuntime.ts');
const processor = await fs.readFile(processorPath, 'utf8');
const runtime = await fs.readFile(runtimePath, 'utf8');

const failures = [];
const mapDeclarations = (text) => (text.match(/new\s+Map\s*</g) ?? []).length;

if (!/export const n06Processor\s*=\s*new N06Processor\(\)/.test(processor)) failures.push('CANONICAL_N06_PROCESSOR_MISSING');
if ((processor.match(/new\s+Map<Nucleus06Capability/g) ?? []).length !== 1) failures.push('N06_HANDLER_REGISTRY_COUNT_INVALID');
if (!/CAPABILITY_HANDLER_ALREADY_REGISTERED/.test(processor)) failures.push('DUPLICATE_HANDLER_GUARD_MISSING');
if (!/N06_PILOT_ALREADY_REGISTERED/.test(processor)) failures.push('DUPLICATE_PILOT_GUARD_MISSING');
if (mapDeclarations(runtime) !== 0) failures.push('SECOND_N06_RUNTIME_REGISTRY_DETECTED');
if (!/return n06Processor\.execute\(/.test(runtime)) failures.push('COMPATIBILITY_RUNTIME_NOT_DELEGATING_TO_PROCESSOR');

const report = {
  system: 'SOUL',
  nucleus: 'N06',
  invariant: 'single-execution-authority',
  authority: 'lib/soul-core/N06Processor.ts::n06Processor',
  checkedAt: new Date().toISOString(),
  state: failures.length ? 'FAIL' : 'PASS',
  failures,
};
await fs.writeFile(path.join(ROOT, 'N06-AUTHORITY-INTEGRITY.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exit(1);
