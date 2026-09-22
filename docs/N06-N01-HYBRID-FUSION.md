# N06 ↔ N01 Hybrid Fusion

Date: 2026-08-26

## Audit conclusion

N06 is an independent Next.js AI nucleus. Its package currently includes the Vercel AI SDK, an xAI provider, Redis/resumable streaming, PostgreSQL/Drizzle, document/artifact tooling, authentication, and a dedicated Soul Mesh layer. The existing chat route is a real AI runtime: it authenticates the user, loads persisted conversation context, selects an AI model, and runs streaming generation with document/weather/suggestion tools.

The previous Mesh was not equivalent to full AI integration. The main Mesh endpoint only executed `mesh.ping` and `mesh.describe`; other capabilities returned `CAPABILITY_HANDLER_NOT_REGISTERED`. The health route advertised capabilities that the endpoint did not actually execute. The handshake also used the legacy `chatbot-2000` identity. These are fixed conceptually in this branch through a new fusion endpoint/runtime and canonical N06 contracts.

## N06 identity

N06 remains N06 everywhere in the new contract. The legacy `chatbot-2000` label is not used as a protocol nucleus identity.

## Fusion boundary

The goal is not to merge source code or destroy independence. It is a capability-mediated fusion:

`N01 AI ↔ Soul Mesh ↔ N06 AI`

N01 may invoke N06's reasoning/conversation/context/tool discovery capabilities. N06 can invoke N01 through the outbound peer client when a real N01 endpoint is configured. Each nucleus keeps its own model/runtime, memory, tools and execution environment.

## Capabilities exposed by N06

- `mesh.handshake`
- `mesh.describe`
- `ai.reasoning`
- `conversation`
- `tools.describe`
- `context.orchestration`

The AI capabilities use the existing `myProvider` boundary and its configured chat/reasoning models rather than introducing another model provider. The inspected provider currently maps production chat/reasoning/title/artifact/image models to xAI adapters.

## Tool interoperability

N06 advertises the tools already present in its chat runtime:

- getWeather
- createDocument
- updateDocument
- requestSuggestions

The fusion boundary deliberately distinguishes session-free capabilities from user-session-bound tools. A remote nucleus can discover the catalog, but it cannot silently impersonate a user's authenticated session.

## Bidirectional transport

`N06PeerClient` implements authenticated, correlated outbound requests with:

- canonical N06 source identity;
- target nucleus identity;
- correlation ID validation;
- response protocol validation;
- timeout;
- bounded retry/backoff;
- optional bearer token.

The endpoint is supplied by deployment configuration. No URL is fabricated and no remote nucleus is marked connected until an actual request succeeds.

## Why this is more than a ping

A successful `mesh.ping` proves only transport reachability. Fusion requires:

1. N01 sends a real capability request.
2. N06 validates it.
3. N06 dispatches to a real runtime handler.
4. N06's existing AI runtime executes the requested function.
5. N06 returns a correlated response.
6. N01 validates source, target, protocol and correlation.
7. The result is available to N01's own reasoning/gateway pipeline.

The reverse direction uses the same contract.

## Current proof status

This branch proves the code-level contracts and adds the runtime boundary. It does **not** claim a live N01↔N06 connection because a live deployed endpoint and credentials are not available to this repository inspection. Live status must be obtained by executing the request against the deployed N01 endpoint and recording the correlated response.

## Independence invariant

N06 remains independently deployable. N01 remains independently deployable. Mesh is the shared language and transport boundary. The result is interoperability/fusion at the capability and cognition levels without collapsing the nuclei into one application.
