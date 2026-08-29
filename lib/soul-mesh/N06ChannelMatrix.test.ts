import test from 'node:test';
import assert from 'node:assert/strict';
import { N06_CHANNEL_MATRIX, N06_CHANNELS, N06_IN_CHANNELS, N06_OUT_CHANNELS, N06_PEERS, N06_TRANSPORTS, channelsFor, isN06Peer } from './N06ChannelMatrix';

test('N06 exposes exactly five peers and ten directional channels', () => {
  assert.deepEqual(N06_PEERS, ['N01', 'N02', 'N03', 'N04', 'N05']);
  assert.equal(N06_IN_CHANNELS.length, 5);
  assert.equal(N06_OUT_CHANNELS.length, 5);
  assert.equal(N06_CHANNELS.length, 10);
  assert.equal(new Set(N06_CHANNELS).size, 10);
});

test('N06 channel matrix is bidirectional for every peer', () => {
  assert.equal(N06_CHANNEL_MATRIX.length, 5);
  for (const peer of N06_PEERS) {
    const channels = channelsFor(peer);
    assert.equal(channels.inbound, `N06.IN.${peer}`);
    assert.equal(channels.outbound, `N06.OUT.${peer}`);
    assert.deepEqual(N06_CHANNEL_MATRIX.find((entry) => entry.peer === peer)?.transports, N06_TRANSPORTS);
    assert.equal(isN06Peer(peer), true);
  }
  assert.equal(isN06Peer('N06'), false);
});
