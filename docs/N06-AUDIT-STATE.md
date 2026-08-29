# SOUL N06 — AI Optimization Audit

## Identity
N06 is the support/cognitive-assistance nucleus. Its current source defines support for context, artifacts, documents, tool execution, streaming, mesh communication and an AI pilot. The project already has a canonical N06 capability list and affinity map.

## Baseline findings
- The repository is a Next.js AI application using the Vercel AI SDK and streaming `streamText` in the chat route.
- N06 had a naming/ownership defect: the N06 runtime was implemented in a file named `Nucleus05Processor.ts` and its canonical processor was still typed against N05 capabilities.
- The N06 mesh dispatcher exposed legacy capability names (`ai-pilot`, `artifact-processing`, etc.) that did not match the canonical N06 capability names (`support.*`).
- Native N06 capability activation registered handlers under the legacy names, creating a mismatch between the declared N06 capability contract and executable handlers.
- N06 tool execution had no explicit capability policy boundary.
- CI validated the legacy nucleus processor but did not execute the new N06 cognitive runtime test.

## Repairs applied
1. Canonicalized `Nucleus06Processor` around `NUCLEUS_06_CAPABILITIES` while retaining compatibility exports so existing imports are not broken.
2. Rebound native handlers to `support.artifacts`, `support.documents`, `support.context`, `support.streaming`, and `support.mesh`.
3. Reworked `N06CapabilityDispatcher` to use canonical N06 capabilities and enforce the execution policy before dispatch.
4. Added `N06ExecutionPolicy` with an explicit allowlist and five-step execution ceiling, including registered tools.
5. Added `Nucleus06Processor.test.ts` covering canonical capability recognition, handler execution, unknown-capability rejection and step limits.
6. Added `test:nucleus06` and integrated it into `soul-mesh-ci.yml`.

## AI-security alignment
The execution boundary deliberately separates capability authorization from model output and limits agent/tool agency. This follows current OWASP guidance emphasizing prompt injection, excessive agency, least privilege, output handling and bounded execution for agentic AI systems.

## Validation status
Structural validation: READY.
CI execution: NOT YET OBSERVED in the available GitHub workflow-run interface for the latest commit.
Live provider inference: NOT claimed; the existing application provider remains the model execution layer, while N06 owns orchestration/support capability boundaries.

## N06 completion criterion
N06 is structurally complete when the canonical capability contract, native handlers, mesh dispatcher, execution policy, cognitive processor and automated tests all agree on the same capability vocabulary and the CI pipeline executes those tests successfully. Live browser/cloud provider behavior is an integration/comissioning concern and does not justify leaving the structural work in a loop.
