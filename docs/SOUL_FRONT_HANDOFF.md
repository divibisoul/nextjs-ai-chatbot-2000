# N06 — SOUL Front Handoff

## What this front has done

N06 is being treated as an independent AI specialized in planning, validation, orchestration, and capability composition. Its cooperation with N05 must multiply capability rather than merely expose another HTTP endpoint.

## Current pair direction

- N05 provides inference/reasoning/contextual interpretation.
- N06 provides planning/validation/orchestration.
- Combined pattern: reason -> plan -> validate -> return/continue.

## Current status

- Pair: N05 <-> N06
- Mode: simultaneous pair work
- Runtime E2E: not claimed until both live endpoints are available and the complete chain is executed.
- Source-level synergy: the N05/N06 cooperation layer is part of the current integration direction.

## What N06 wants from the other fronts

N01/N02 and N03/N04 should publish their completed work into the shared handoff so N06 can consume verified capabilities rather than reimplement them.

When a capability becomes available, record:

- capability identifier;
- owning nucleus;
- actual implementation path;
- input contract;
- output contract;
- validation evidence;
- dependencies;
- whether it is safe to invoke remotely;
- next nucleus that should consume it.

## Shared engineering protocol

READ -> CLAIM -> MODIFY -> VALIDATE -> HANDOFF -> CONSUME

Global coordination record:
`docs/SOUL_MULTI_FRONT_HANDOFF.md` in N01.

## Do not duplicate

Do not create another Mesh protocol, capability registry, correlation system, or combo mechanism until the existing N06 and global coordination records have been inspected.
