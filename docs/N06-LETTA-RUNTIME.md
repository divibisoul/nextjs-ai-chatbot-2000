# N06 Letta Runtime Adapter

N06 owns the executable Letta adapter. The adapter uses Letta's REST endpoints for agent messages, message history and agent retrieval, while preserving the SOUL correlation ID and exact upstream commit.

Operations:
- `letta.agent.message`
- `letta.agent.history`
- `letta.agent.status`

Runtime configuration requires `N06_LETTA_API_KEY` and `N06_LETTA_AGENT_ID`. The adapter fails closed when credentials, agent identity or provider access are unavailable.
