# N07 Neural Fabric Handoff

N07 is the canonical orchestration/neural service. N06 retains tool, artifact and capability ownership while consuming shared neural, prefrontal and compute services through Soul Mesh.

Contract: `soul-mesh/1`, `1.1.0`; operations `neural.forward@1.0.0`, `neural.learn@1.0.0`.

Preserve correlationId, finite payloads, nonce/HMAC, bounded requests, deadlines, retries and explicit errors. Read the current N07 `main` and the current bridge SHA before editing. A concurrent branch must never be overwritten.

WHAT_CHANGED: N06 is explicitly part of the shared N07 Neural Fabric and can consume the canonical neural service.
WHAT_REMAINS: exact-head CI and live bidirectional commissioning.
WHAT_NEXT_AGENT_SHOULD_DO: retain N06 tool/runtime ownership and use Mesh delegation to N07 rather than duplicating its neural runtime.


## Orbital reasoning / Prefrontal consumer contract — 2026-10-01

This nucleus remains the owner of its native agents and tools. It may consume the N07 canonical capabilities through the existing Soul Mesh when the runtime needs resource simulation or risk-bearing admission:

- `transcendental.estimate@1.0.0` — N07 TCE deterministic resource simulation; simulation evidence only, never physical-hardware evidence.
- `prefrontal.orbital.evaluate@1.0.0` — N07 TCE evidence combined with the canonical Prefrontal admission boundary.

The local agent/tool must preserve the existing `correlationId`, `traceId`, Mesh authentication/deadline contract and its own ownership. This is a consumer path, not a copied TCE/Prefrontal runtime.
