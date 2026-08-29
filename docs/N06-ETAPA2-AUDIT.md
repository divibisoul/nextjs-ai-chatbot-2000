# N06 — Etapa 2 Audit Baseline

This file records the executable contract for the N06 upgrade. N06 is an independent AI nucleus; Soul Mesh is its inter-nucleus communication layer.

## Completion contract
- identity: N06
- peers: N01, N02, N03, N04, N05
- local capabilities are declared and executable state is discoverable
- inbound Mesh validates identity, correlation, timestamp and capability
- local execution remains independent of peer availability
- peer delegation uses Soul Mesh rather than a parallel API
- responses preserve correlationId and identify N06 as source
- tool execution is policy-authorized and bounded
- CI executes N06 tests
- legacy N05 naming is compatibility-only and must not define N06 ownership

## Findings from repository audit
- N06 runtime ownership is correctly represented by Nucleus06Processor, but compatibility imports still point through Nucleus05Processor.
- N06 Mesh route already exposes N06 identity, five peers, agents, declared/executable capabilities, channels, authentication and payload-size checks.
- Mesh protocol validates structure but does not enforce timestamp freshness or field bounds.
- The route creates agents per request instead of retaining a canonical registry instance.
- N06 capability runtime and dispatcher coexist; the dispatcher is the active Mesh execution boundary.
- CI executes the N06 processor test, but there is no explicit Mesh route contract test.

## Upgrade direction
Preserve all working behavior. Harden validation, canonicalize N06 ownership at new call sites, make discovery reflect executable runtime state, and add regression coverage for the Mesh contract without introducing a second communication API.
