import test from 'node:test';
import assert from 'node:assert/strict';
import { delegateN06ExternalCapability } from './N06ExternalCapabilityBridge';

test('N06 external capability bridge requires correlation', async () => {
  await assert.rejects(
    delegateN06ExternalCapability({ capability: 'strategic_planning', correlationId: ' ' }),
    /N06_EXTERNAL_CORRELATION_REQUIRED/,
  );
});
