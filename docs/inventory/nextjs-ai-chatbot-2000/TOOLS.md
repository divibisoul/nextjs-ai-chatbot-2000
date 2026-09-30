# FASE 0 — N06 TOOLS / CAPABILITIES

## B1 IDENTIDADE
Primário: sessão, contexto e processamento cognitivo.
Secundários: tools contextuais, Mesh, peer discovery e composição com N05/N04.
Papel octacore: processador de contexto que mantém continuidade para os demais núcleos.

## B2 PROCESSADORES
| Nome | Path | Responsabilidade | Estado |
|---|---|---|---|
| N06Processor | lib/soul-core/N06Processor.ts | processamento cognitivo | ativo |
| N06CapabilityDispatcher | lib/soul-mesh/N06CapabilityDispatcher.ts | dispatch capability | ativo |
| N06AgentRegistry | lib/soul-mesh/N06AgentRegistry.ts | agents | ativo |
| Mesh Tool Context | lib/soul-mesh/N06MeshToolContext.ts | contexto de tool | ativo |
| N06PeerAdapter | lib/soul-mesh/N06PeerAdapter.ts | discovery/peer | ativo quando config |
| API Mesh route | app/api/soul-mesh/route.ts | boundary | ativo |

## B3 ENDPOINTS
| Método | Path | Estado |
|---|---|---|
| GET | /api/soul-mesh | LIVE quando deploy |
| POST | /api/soul-mesh | LIVE quando deploy/auth |
| request capability | mesh.ping / mesh.describe / mesh.discovery | EXECUTABLE |
| request capability | contextual tools | BLOCKED_ENV/CONTEXT sem sessão |

## B4 FUNÇÕES
| Módulo | Função | Assinatura resumida | Consumidores |
|---|---|---|---|
| endpoint | validateMeshMessage | (message,nucleusId?) => true | route |
| endpoint | handleMeshMessage | (message,handlers?) => Promise<Message> | Mesh |
| dispatcher | executeN06Capability | (capability,payload,context?) | agents |
| dispatcher | getN06Capabilities | () => capabilities | discovery |
| processor | executableCapabilities | () => string[] | route/tests |

## B5/B6 EVENTOS
Mesh request/response/event é a fronteira principal. Lista fechada de eventos internos não foi enumerada nesta auditoria: PENDING.

## B7 EXTERNOS
Next.js/Vercel, Postgres/Drizzle, AI SDK/provider, Redis opcional, autenticação/session.

## B8 INTER-NÚCLEO
N01/N02/N03/N04/N05/N07 via Mesh 1.1.0. Contexto de usuário é exigido por determinadas capabilities. SARA usa a fronteira existente quando configurada.

## B9 ADORMECIDAS
| Ferramenta | Precisa de | Estado |
|---|---|---|
| contextual tools | session/user context | BLOCKED_ENV/CONTEXT |
| peer discovery | SOUL_MESH_N0X_URL + auth | BLOCKED_ENV |
| Clareira | N01 reachable | BLOCKED_ENV |
| SARA | URL/token | BLOCKED_ENV |
| capabilities recovery | provider/context real | PENDING conforme capability |

## B10 EXECUTÁVEIS
mesh.ping/describe/discovery e capabilities do N06Processor sem contexto quando seu contrato permite.

## B11 EXPANSÃO
| Ao conectar | Ganha | Perde | Neutro |
|---|---|---|---|
| N05 | inference com sessão | nenhuma | context ownership |
| N04 | tools com contexto | nenhuma | session |
| N02 | conversation + context | nenhuma | provider |
| N03 | perception + context | nenhuma | local state |
| N01 | Mesh/Clareira | nenhuma | context |
| N07 | orchestration/session | nenhuma | N06 ownership |
| SARA | governed regenerative context | nenhuma | session |

Inventário recursivo completo permanece PENDING quando a árvore integral não está disponível.
