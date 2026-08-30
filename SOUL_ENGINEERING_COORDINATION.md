# SOUL — Unified Engineering Coordination Contract

This repository is N06, an independent AI nucleus cooperating through the single Soul Mesh.

GitHub is source of truth. Preserve and adapt working functionality; audit before and after changes; continue structural implementation when runtime commissioning is unavailable; never create a second Mesh. Every nucleus is an independent AI with agents, capabilities, tools, ingress, egress, discovery, delegation and response. Authentication is separate from capability authorization. Maintain the common identity/correlation/timestamp/nonce/HMAC contract. Do not duplicate existing modules; adapt them. Research viable alternatives before accepting limitations.

Engineering pair order: N06↔N05 → N05↔N04 → N04↔N03 → N03↔N02 → N02↔N01. Runtime routing remains Mesh-wide; sequence is engineering dependency order.

Two adjacent fronts may be developed simultaneously when safe. Findings must be handed forward through GitHub. Each work unit records source, target, connection, commit, changed files, findings, corrections, affected capabilities/agents/tools, dependencies, remaining work, compatibility, next consumer and commissioning status.

## Cross-front observations

The other active workstreams must be treated as implementation sources, not merely documentation. The N05 branch `upgrade/n05-cumulative-audit-2026-08-30` currently exposes a richer capability contract with explicit owner, consumers, fallbacks, agents, tools, composability and a `ComposedCapability` provenance model. N04 has an active cooperative execution line (`upgrade/n04-synergy-crossfusion-final`) whose latest documented contract includes worker-pool parallel execution, hybrid Mesh transport negotiation, five IN/five OUT peer channels, capability composition and six-front GitHub handoff. These structures are compatible with N06's existing Mesh contract and should be reused/adapted rather than recreated.

N06-N05 fusion implementation note: remote capabilities must be supplied as full descriptors, not only IDs, because N05 capability IDs are not necessarily present in N06's local catalog. N06 `N06SynergyEngine` therefore accepts remote capability descriptors, evaluates input/output compatibility, maps remote agents, detects compatible tools and accounts for declared parallel execution while preserving the existing Mesh and capability composition contracts.

## Current N06 work unit

Source: N06. Target: N05. Connection: N06↔N05 capability fusion. Commit: 1dff65fc095b2f1ce0d4f180da845f2122b23a43. Changed file: `lib/soul-mesh/N06SynergyEngine.ts`. Finding: the previous evaluator attempted to resolve remote capability IDs through N06's local catalog, which could silently produce no candidates for legitimate N05 capabilities. Correction: consume remote descriptors directly and calculate compatibility from declared consumes/produces, agent coverage, compatible tools and execution mode. Remaining: wire the evaluator to the actual N05 Mesh discovery/delegation snapshot and validate the composed invocation path. Next consumer: N05 integration workstream. Commissioning: structural validation complete; live multi-process validation requires the nuclei to be running together.

Optimize connected pairs multiplicatively through complementary agents/tools, reuse, parallelism, low latency, resilience, least privilege and minimal duplication. A numerical synergy score is evidence only when grounded in actual compatible components; never inflate a score merely to satisfy a target number.
