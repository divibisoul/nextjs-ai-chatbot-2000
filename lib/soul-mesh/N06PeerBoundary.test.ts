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

test('N06 active execution peers include the canonical N07 gateway', () => {
  assert.deepEqual([...N06_ACTIVE_PEERS], ['N01','N02','N03','N04','N05','N07']);
  assert.deepEqual([...SOUL_MESH_ACTIVE_PEERS], ['N01','N02','N03','N04','N05','N07']);
  assert.deepEqual(getN06Peers().map(peer => peer.id), ['N01','N02','N03','N04','N05','N07']);
});

test('N07 is no longer structural-only after its authenticated route is enabled', () => {
  assert.deepEqual([...N06_STRUCTURAL_PEERS], []);
  assert.deepEqual([...SOUL_MESH_STRUCTURAL_PEERS], []);
  assert.deepEqual([...N06_ALL_PEERS], ['N01','N02','N03','N04','N05','N07']);
  assert.deepEqual([...SOUL_MESH_PEERS], ['N01','N02','N03','N04','N05','N07']);
  assert.deepEqual(getN06StructuralPeers().map(peer => peer.id), []);
  assert.deepEqual(describeN06StructuralPeers(), []);
});

test('N06 active routes include N07 and the structural-only final route is empty', () => {
  assert.equal(R6_PEER_ROUTES.length, 12);
  assert.equal(R6_PEER_ROUTES.some(route => route.peer === 'N07' && route.direction === 'out' && route.enabled), true);
  assert.equal(R7_PEER_ROUTES.length, 0);
});
