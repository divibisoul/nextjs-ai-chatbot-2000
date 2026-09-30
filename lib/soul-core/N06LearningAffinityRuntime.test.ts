import assert from 'node:assert/strict';
import test from 'node:test';
import { validateLearningVectors } from './N06LearningAffinityRuntime';

test('N06 learning affinity accepts paired vectors of equal dimension', () => {
  assert.doesNotThrow(() => validateLearningVectors([0.1, 0.2], [0.2, 0.3]));
});

test('N06 learning affinity rejects missing target vectors', () => {
  assert.throws(
    () => validateLearningVectors([0.1, 0.2], undefined),
    /N06_LEARNING_AFFINITY_INPUT_TARGET_MUST_BE_PAIRED/,
  );
});

test('N06 learning affinity rejects dimension mismatch', () => {
  assert.throws(
    () => validateLearningVectors([0.1, 0.2], [0.2]),
    /N06_LEARNING_AFFINITY_DIMENSION_MISMATCH/,
  );
});
