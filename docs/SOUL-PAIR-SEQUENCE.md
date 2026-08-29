# SOUL — Sequential Pair Integration Contract

## Purpose

The six nuclei are independent AIs connected by one canonical Soul Mesh. Optimization and integration are performed simultaneously at the system level, but the compatibility work follows the physical/logical adjacency sequence of the architecture.

## Canonical pair sequence

1. N06 <-> N05
2. N05 <-> N04
3. N04 <-> N03
4. N03 <-> N02
5. N02 <-> N01

A pair is not considered structurally closed merely because transport exists. Both nuclei must expose compatible identity, agents, capabilities, tools, input/output contracts, delegation semantics, correlation, authorization and fallback behavior.

## Pair audit rule

For every pair, inspect both sides simultaneously:

- AI role and specialization
- agent registry and executable agents
- declared capabilities versus executable handlers
- tools and tool permissions
- inbound Mesh
- outbound Mesh
- capability discovery
- request/response correlation
- authentication and message integrity
- authorization/ownership
- timeout/retry/failure behavior
- complementary capabilities
- delegation direction in both ways
- fallback ownership

Existing functionality must be reused or repaired before adding anything new. A duplicate Mesh, duplicate transport or duplicate capability registry is prohibited.

## Complementarity rule

A pair must be evaluated as a cooperative unit. The objective is not to make both nuclei perform the same work. The objective is to make their specialized capabilities compose so that one nucleus increases the useful output of the other.

A capability may be implemented as a local tool when it is deterministic and bounded, or delegated to another nucleus when independent reasoning/cognition is required. This follows current multi-agent guidance on matching tools versus sub-agents and capability-based routing.

## Sequence does not prohibit runtime delegation

The optimization sequence is N06-N05-N04-N03-N02-N01. Runtime delegation may still use any authorized nucleus when the CapabilityGraph says that nucleus owns the required capability. The sequence controls engineering order, not an artificial restriction on the runtime graph.

## Completion gate

Only after the current adjacent pair is structurally coherent do we move the optimization focus to the next adjacent pair. System-wide auditing continues in parallel so changes never create incompatible contracts above or below the active pair.

## Verification status

Runtime execution may be unavailable during repository-only implementation. In that case, structural readiness is recorded separately from live commissioning; inability to execute a runtime test is never treated as permission to stop structural integration.
