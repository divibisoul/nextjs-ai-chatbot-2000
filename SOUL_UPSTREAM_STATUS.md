# N06 — Public upstream integration status
**Snapshot:** 2026-10-25 · **Inspected N06 main:** `8ea114ba19607347b12c7aa2adf8e1c51c8d79d2`  
**Audit branch:** `audit/ai-nucleus-status-2026-10-25`

## Sources pinned

| Public source | Pinned SHA | Native augmentation | State |
|---|---|---|---|
| [OpenHands](https://github.com/OpenHands/OpenHands) | `2414d6ee5e31bede2e78211f72b58e9949575a75` | Bounded software agent/tool execution | External session adapter configured in N07; availability and real round-trip not proven |
| [MetaGPT](https://github.com/FoundationAgents/MetaGPT) | `11cdf466d042aece04fc6cfd13b28e1a70341b1f` | Role-based collaboration and software process | Generic N07 runner exists; a successful provider execution is not evidenced |
| [smolagents](https://github.com/huggingface/smolagents) | `c30b115286e000e98711fae5e85993547b73d826` | Bounded code/tool-agent execution | Generic N07 runner exists; source/runtime package identity and live result unverified |
| [DSPy](https://github.com/stanfordnlp/dspy) | `ba3f9198efe5d125c7c1a2b40b1f1e6166209bd2` | LM-programming/reasoning-pipeline optimization | Generic adapter exists; the current generic path uses `Predict("question -> answer")`, not proof of an optimization/evaluation cycle |

## Ownership and contract

N06's responsibility remains cognitive support, reasoning/session/context, artifacts and tool execution. Public upstreams should improve planning, tool behavior or measurable reasoning quality, not replace N06's native processors. `lib/soul-core/N06ExternalCapabilityFabric.ts` catalogs provider IDs, pins and target functions; most states are `CATALOG_BOUND`, which is not synonymous with executable or runtime verified.

## Required evidence / safeguards

1. Test the exact provider API/package version against the pinned source; no global import may stand in for the pinned submodule without a lock/provenance record.
2. Give each adapter an explicit capability allowlist, timeout, resource budget, artifact boundary and action policy. OpenHands/code agents must not receive broad unbounded filesystem/shell privileges.
3. DSPy claims of optimization need evaluation data, baseline metric and improvement measurement; a single text prediction is not optimization evidence.
4. Execute one real task per provider in a controlled environment, validate structured output and provenance, then pass a native N06 capability through N07 Mesh and verify owner/correlation on return.
5. Keep provider errors explicit; do not turn missing package/model/credentials into successful empty outputs.

**Gate:** `CATALOG_BOUND / ADAPTER_PLANNED`; live provider/model output and Mesh integration remain unverified in this audit.
