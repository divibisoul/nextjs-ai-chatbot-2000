# Soul — Nucleus 06 affinity integration

Nucleus 06 is an integral support nucleus for N01–N05. It is not a replacement
for their domain capabilities and must not duplicate their implementations.

## Ownership rule

- N01 owns Android/native capabilities.
- N02 owns its AI interaction/tool capabilities.
- N03 owns its specialized knowledge/domain capabilities.
- N04 owns its AI/tool capabilities.
- N05 owns its AI/tool/artifact capabilities.
- N06 owns support orchestration around context, documents, artifacts,
  tool support and communication, and bridges into capabilities owned by the
  other nuclei.

## Affinity rule

N06 may consume, normalize, cache, validate, stream and coordinate a capability
owned by another nucleus. It must not silently fork or replace that capability.

## Six-nucleus support topology

```text
N01 ─┐
N02 ─┤
N03 ─┤
N04 ─┼──> N06 support layer <── capability ownership remains external
N05 ─┤
N06 ─┘
```

The map is an architectural contract, not proof of a live network connection.
A connection is only considered active after transport, endpoint, correlation,
acknowledgement and health-check evidence exist.

## Tool affinity

The existing document/artifact/weather/suggestion tools remain available through
N06 as support services. N06 should expose stable capability contracts rather
than duplicate their implementations.
