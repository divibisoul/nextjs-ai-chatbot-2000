import { randomUUID } from 'node:crypto';
import { sendFromN06, type N06Peer } from '../soul-mesh/N06PeerAdapter';
import { saraCapabilities } from '../sara/SARAClient';

export type N06ObservedLearningPrimitive =
  | 'neural.learn'
  | 'neural.forward'
  | 'neural.parameters'
  | 'sara.capabilities';

export type N06LearningAffinityInput = {
  input?: number[];
  target?: number[];
  correlationId?: string;
};

export type N06LearningAffinityStep = {
  nucleus: N06Peer | 'SARA';
  capability: N06ObservedLearningPrimitive;
  status: 'executed' | 'blocked' | 'skipped';
  result?: unknown;
  error?: string;
};

export type N06LearningAffinityResult = {
  correlationId: string;
  primitivesObserved: N06ObservedLearningPrimitive[];
  steps: N06LearningAffinityStep[];
  learningExecuted: boolean;
};

/**
 * Composes only learning primitives that have concrete owners in the live Mesh.
 *
 * N06 remains the composition layer. N07 owns neural execution; SARA owns its
 * governance/capability surface. This function never reimplements either.
 */
export async function executeN06LearningAffinity(
  request: N06LearningAffinityInput = {},
): Promise<N06LearningAffinityResult> {
  const correlationId = request.correlationId?.trim() || randomUUID();
  const steps: N06LearningAffinityStep[] = [];

  let neuralParameters: unknown;
  try {
    neuralParameters = await sendFromN06('N07', 'neural.parameters', {}, 15000, correlationId);
    steps.push({
      nucleus: 'N07',
      capability: 'neural.parameters',
      status: 'executed',
      result: neuralParameters,
    });
  } catch (error) {
    steps.push({
      nucleus: 'N07',
      capability: 'neural.parameters',
      status: 'blocked',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const saraCapabilitiesResult = await saraCapabilities(correlationId);
    steps.push({
      nucleus: 'N07',
      capability: 'sara.capabilities',
      status: 'executed',
      result: saraCapabilitiesResult,
    });
  } catch (error) {
    steps.push({
      nucleus: 'N07',
      capability: 'sara.capabilities',
      status: 'blocked',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const hasInput = Array.isArray(request.input) && request.input.length > 0;
  const hasTarget = Array.isArray(request.target) && request.target.length > 0;

  if (hasInput !== hasTarget) {
    throw new Error('N06_LEARNING_AFFINITY_INPUT_TARGET_MUST_BE_PAIRED');
  }

  if (hasInput && hasTarget) {
    if (request.input!.length !== request.target!.length) {
      throw new Error('N06_LEARNING_AFFINITY_DIMENSION_MISMATCH');
    }

    try {
      const result = await sendFromN06(
        'N07',
        'neural.learn',
        {
          input: request.input,
          target: request.target,
          parameters: neuralParameters,
          correlationId,
        },
        15000,
        correlationId,
      );
      steps.push({
        nucleus: 'N07',
        capability: 'neural.learn',
        status: 'executed',
        result,
      });
    } catch (error) {
      steps.push({
        nucleus: 'N07',
        capability: 'neural.learn',
        status: 'blocked',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  } else {
    steps.push({
      nucleus: 'N07',
      capability: 'neural.learn',
      status: 'skipped',
      error: 'training vectors were not supplied',
    });
  }

  return {
    correlationId,
    primitivesObserved: [
      'neural.parameters',
      'neural.learn',
      'sara.capabilities',
    ],
    steps,
    learningExecuted: steps.some(
      step => step.capability === 'neural.learn' && step.status === 'executed',
    ),
  };
}
