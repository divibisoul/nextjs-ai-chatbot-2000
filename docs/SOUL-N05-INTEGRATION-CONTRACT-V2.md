# N05 Integration Contract v2

N05 remains the orchestration, dispatch and execution-coordination nucleus. Its existing Pilot/processor/tool functionality is preserved while its routing role is made compatible with the global Soul Pilot/Cockpit.

## Canonical identity
N05 peers are N01, N02, N03, N04 and N06.

## Five IN / five OUT
N05 exposes one logical IN and one logical OUT for each peer. All 10 local channel endpoints are transport-neutral.

## Hybrid transport
Supported transport families are IN_PROCESS, WEBVIEW_BRIDGE, LOOPBACK_HTTP, HTTP and REALTIME. Selection is negotiated at runtime; the logical route remains stable.

## Hierarchy
N05 is a preferred dispatch/orchestration nucleus, not the owner of the entire Soul. The global Cockpit/Pilot may route directly to any nucleus according to capability affinity.

## Synergy
N05 combines requests/context from N01-N04 and N06 into executable plans and dispatches work without serializing independent operations unnecessarily. Parallel work must retain correlation IDs and deterministic aggregation.

## Proof rule
A dispatch is successful only when the target capability executes and returns a correlated result. Route existence, peer registration or health metadata alone never proves execution.
