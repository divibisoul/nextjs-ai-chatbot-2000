import { N06CapabilityExecutionPolicy } from './N06CapabilityExecutionPolicy';

/** Structural readiness snapshot. It deliberately does not claim runtime connectivity. */
export function getN06InteropHealth() {
  const policy = new N06CapabilityExecutionPolicy();
  return {
    nucleus: 'N06',
    protocol: 'soul-mesh/1',
    inbound: true,
    outbound: true,
    localCapabilities: policy.listLocalCapabilities(),
    peers: ['N01', 'N02', 'N03', 'N04', 'N05'],
    runtimeConnectivityTested: false,
    readiness: 'structurally-prepared',
  } as const;
}
