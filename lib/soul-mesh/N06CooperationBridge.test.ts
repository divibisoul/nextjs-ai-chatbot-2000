import assert from 'node:assert/strict';
import test from 'node:test';
import { requestN07CooperationExchange, requestN07CooperationHandshake } from './N06CooperationBridge';

test('N06 cooperation handshake validates required target', async () => {
  await assert.rejects(
    () => requestN07CooperationHandshake({ target: '' as never, requiredCapability: 'gemini.text.generate' }),
    /N06_COOPERATION_TARGET_REQUIRED/,
  );
});

test('N06 cooperation exchange validates required target and capability', async () => {
  await assert.rejects(
    () => requestN07CooperationExchange({ target: '' as never, capability: 'inference.analyze' }),
    /N06_COOPERATION_TARGET_REQUIRED/,
  );
  await assert.rejects(
    () => requestN07CooperationExchange({ target: 'N05', capability: '' }),
    /N06_COOPERATION_CAPABILITY_REQUIRED/,
  );
});
