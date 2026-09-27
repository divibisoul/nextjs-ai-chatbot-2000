# N06 → N07 Neural Federation

N06 exposes shared neural workloads through `lib/soul-neural/N07NeuralBridge.ts`. The bridge uses Soul Mesh contract `1.1.0`, HMAC-SHA256, correlation, nonce, timeout and finite-value validation.

N06 remains owner of its contextual tools, agents and capabilities. N07 is the shared neural orchestration/processing owner. The adapter is additive and designed for concurrent-front reconciliation.


## Octacore G6 federation extension

N06 is now also an explicit G6 source for the federated context path. When `OCTACORE_FEDERATED_CONTEXT_ENABLED=true`, the chat route submits `octacore.federated_context_cycle` to N07 through the existing Soul Mesh peer client with the original chat correlation. N07 performs G4 research and optional G3 perception in the `pre` parallel group, joins the barrier, then executes the authoritative G0 SARA audit/cycle. The existing direct SARA path remains intact and is selected when the flag is off.
