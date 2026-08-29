# Soul Mesh — N06 all-peer integration

N06 is transport-ready for N01, N02, N03, N04 and N05. URLs are supplied at runtime through `SOUL_MESH_N01_URL` through `SOUL_MESH_N05_URL`; no provider API is introduced by this layer.

## Contract

Every peer uses the same logical envelope: `version`, `messageId`, `source`, `target`, `timestamp`, `nonce`, `correlationId`, `type`, `payload`, and optional HMAC.

Inbound convention: `POST /mesh/in`.
Health convention: `GET /mesh/health`.

## Connectivity

Run `node scripts/soul-mesh-connect-all.mjs` with the five peer URLs configured. The script tests all peers concurrently and reports configured/reachable counts. A configured peer returning an error makes the probe fail; an unconfigured peer is reported rather than treated as a false success.

## Design rules

- Each N01–N06 remains an independent AI/runtime.
- Mesh is the interoperability layer, not a replacement runtime.
- Capabilities remain owned by their specialized nucleus.
- Requests carry correlation and trace context so a multi-hop combo can be reconstructed. This follows the distributed tracing principle of propagating context across process boundaries. See OpenTelemetry context propagation: https://opentelemetry.io/docs/concepts/context-propagation/.
- Health and readiness are distinct operational concepts; a healthy process is not necessarily ready to accept peer work. See Kubernetes probe guidance: https://kubernetes.io/docs/concepts/workloads/pods/probes/.
- No claim of live connectivity is made until the peer processes are reachable and the probe returns successful responses.
