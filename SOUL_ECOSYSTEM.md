# SOUL Ecosystem

**SOUL component:** N06 — cognição, raciocínio e agentes de execução

This repository is a public component of the **SOUL ecosystem**. Upstream projects are attached by functional similarity and remain attributable to their original maintainers.

## Attached upstream capabilities
- **openhands** — https://github.com/OpenHands/OpenHands.git — pinned at `2414d6ee5e31bede2e78211f72b58e9949575a75`
- **metagpt** — https://github.com/FoundationAgents/MetaGPT.git — pinned at `11cdf466d042aece04fc6cfd13b28e1a70341b1f`
- **smolagents** — https://github.com/huggingface/smolagents.git — pinned at `c30b115286e000e98711fae5e85993547b73d826`
- **dspy** — https://github.com/stanfordnlp/dspy.git — pinned at `ba3f9198efe5d125c7c1a2b40b1f1e6166209bd2`

Canonical SOUL integration map: https://github.com/divibisoul/Orquestrador-/blob/main/integrations/external-capabilities.json

## Functional integration boundary

The binding contract for this component is recorded in `integrations/capability-boundary.json`. It states why each upstream capability is present, the canonical routing boundary, the engineering agent responsible, and the evidence gate before runtime activation.

## Runtime truth
Structural attachment is not runtime proof; adapters, configuration and end-to-end tests are required for activation.
