# N06 — agentes e responsabilidades locais

## Agentes N06 registrados pelo runtime

| Agente | Responsabilidade |
|---|---|
| N06-cognitive-agent | Executar as capabilities cognitivas realmente expostas pelo N06 processor. |
| N06-tool-agent | Executar as ferramentas N06 registradas, usando contexto autenticado quando requerido. |
| N06-mesh-agent | Ping, descrição e descoberta dos peers/canais N06; não substitui o Mesh canônico N07. |

## Agentes da composição N05↔N06

| Agente | Núcleo | Responsabilidade |
|---|---|---|
| N06.planner | N06 | Planejamento para execução pelo N06. |
| N06.validator | N06 | Validação de resultados/planos para consumo do N05. |
| N05.reasoner | N05 | Inferência usada pela etapa de composição N06↔N05. |

A composição não move os agentes de seus núcleos: ela apenas os conecta pelo adapter Mesh existente.
