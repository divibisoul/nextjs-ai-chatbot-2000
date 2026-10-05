import assert from 'node:assert/strict';
import test from 'node:test';
import {
  N06_ACTIVE_PEERS,
  N06_ALL_PEERS,
  N06_STRUCTURAL_PEERS,
  describeN06StructuralPeers,
  getN06Peers,
  getN06StructuralPeers,
} from './N06PeerAdapter';
import {
  R6_PEER_ROUTES,
  R7_PEER_ROUTES,
  SOUL_MESH_ACTIVE_PEERS,
  SOUL_MESH_PEERS,
  SOUL_MESH_STRUCTURAL_PEERS,
} from './SoulMeshPeerMatrix';

test('N06 active execution peers remain N01-N05', () => {
  assert.deepEqual([...N06_ACTIVE_PEERS], ['N01','N02','N03','N04','N05']);
  assert.deepEqual([...SOUL_MESH_ACTIVE_PEERS], ['N01','N02','N03','N04','N05']);
  assert.deepEqual(getN06Peers().map(peer => peer.id), ['N01','N02','N03','N04','N05']);
});

test('N07 remains present only as structural peer in generic N06 topology', () => {
  assert.deepEqual([...N06_STRUCTURAL_PEERS], ['N07']);
  assert.deepEqual([...SOUL_MESH_STRUCTURAL_PEERS], ['N07']);
  assert.deepEqual([...N06_ALL_PEERS], ['N01','N02','N03','N04','N05','N07']);
  assert.deepEqual([...SOUL_MESH_PEERS], ['N01','N02','N03','N04','N05','N07']);
  assert.deepEqual(getN06StructuralPeers().map(peer => peer.id), ['N07']);
  assert.equal(describeN06StructuralPeers()[0].execution, 'structural-only');
});

test('N06 active route set excludes N07 and final structural route is disabled', () => {
  assert.equal(R6_PEER_ROUTES.length, 10);
  assert.equal(R6_PEER_ROUTES.some(route => route.peer === 'N07'), false);
  assert.equal(R7_PEER_ROUTES.length, 2);
  assert.equal(R7_PEER_ROUTES.every(route => route.peer === 'N07'), true);
  assert.equal(R7_PEER_ROUTES.every(route => route.enabled === false), true);
});
