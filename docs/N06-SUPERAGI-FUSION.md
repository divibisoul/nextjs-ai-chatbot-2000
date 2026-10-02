# N06 — SuperAGI Agent Fabric Fusion

Status: **IMPLEMENTED-IN-CODE / RUNTIME-REQUIRES-ENV**

Upstream pinned by the SOUL N02 registry:
- Repository: `TransformerOptimus/SuperAGI`
- Commit: `c3c1982e7bd6a11cfed53c5a193ea502f924b1b6`
- License recorded by the acquisition registry: MIT.

Verified upstream API surface at that commit:
- `POST /v1/agent` — create an agent/configuration.
- `POST /v1/agent/{agent_id}/run` — start a run.
- `POST /v1/agent/{agent_id}/run-status` — inspect run status.
- `POST /v1/agent/{agent_id}/pause` — pause runs.
- `POST /v1/agent/{agent_id}/resume` — resume runs.
- `PUT /v1/agent/{agent_id}` — update an agent.

The upstream framework also contains agent workflows, scheduled agents, execution workers, toolkits and agent-memory models. Those remain in the pinned upstream submodule; this fusion does not copy or fork the upstream runtime.

## N06 execution boundary

The canonical N06Processor now exposes six executable SuperAGI lifecycle capabilities. A dedicated `N06-SuperAGI-Agent` is registered by the Mesh route and delegates into the canonical N06Processor.

The bridge calls the actual SuperAGI API with:
- `X-API-Key` for the upstream authentication boundary.
- `X-Correlation-ID` and `x-soul-correlation-id` for SOUL trace continuity.
- A bounded request timeout.
- Fail-closed configuration checks and strict JSON response validation.

Required deployment variables:
- `SOUL_SUPERAGI_URL`
- `SOUL_SUPERAGI_API_KEY`

Without both variables the bridge stops with `SUPERAGI_NOT_CONFIGURED`; it does not silently use Gemini, mocks or synthetic SuperAGI results.

## Ownership

N02 retains the external-source registry and upstream provenance.
N06 owns the executable SuperAGI adapter.
N07 may orchestrate these capabilities via canonical Soul Mesh.
Other nuclei consume them through Mesh rather than duplicating the SuperAGI runtime.

## Validation state

Unit tests cover the real URL paths, API-key propagation, correlation propagation and fail-closed configuration. No live SuperAGI service was available during this change, so live commissioning remains **BLOCKED_ENV**.
