import test from 'node:test';
import assert from 'node:assert/strict';
import {
  N06_EXTERNAL_CAPABILITY_SOURCES,
  getN06ExternalCapabilityCandidates,
} from './N06ExternalCapabilitySources';

test('external capability source catalog is deterministic and unique', () => {
  assert.ok(N06_EXTERNAL_CAPABILITY_SOURCES.length >= 20);

  const ids = N06_EXTERNAL_CAPABILITY_SOURCES.map((source) => source.id);
  assert.equal(new Set(ids).size, ids.length);

  for (const source of N06_EXTERNAL_CAPABILITY_SOURCES) {
    assert.ok(source.status === 'candidate' || source.status === 'adapter-bound');
    assert.ok(source.sourceRepository.trim());
    assert.ok(source.capability.trim());
    assert.ok(source.targetNuclei.length > 0);
  }
});

test('external capability discovery never exposes a non-candidate execution state', () => {
  const matches = getN06ExternalCapabilityCandidates('DeerFlow');
  assert.ok(matches.length >= 3);
  assert.ok(matches.every((source) => source.status === 'candidate'));
});

test('external capability discovery is case-insensitive', () => {
  const upper = getN06ExternalCapabilityCandidates('RIVER');
  const lower = getN06ExternalCapabilityCandidates('river');
  assert.deepEqual(
    upper.map((source) => source.id),
    lower.map((source) => source.id),
  );
});
