# FASE 0 — N06 FORENSIC REPORT

Data: 2026-09-30
MAIN observado: bdcb099166701453b6cb62672fa6a642addbd9b0
Baseline Clareira/Fase1: e987f607d73f11751ab1a1a4b9a75950012dd200
Fase1 branch: integrate/clareira-octapla-2026-09-25

## A — Linhagem e estado
N06 é o núcleo de sessão/contexto/cognição e tools contextuais. O endpoint app/api/soul-mesh/route.ts é real, valida soul-mesh/1 v1.1.0, aplica HMAC quando configurado, replay/rate limiting e encaminha ao N06 capability dispatcher/processor.

O MAIN atual contém correções de composição que alinham N06 aos IDs executáveis de N04/N05 e separam autenticação de transporte das capacidades que realmente exigem contexto de usuário.

## Branches/frentes
Fase1: integrate/clareira-octapla-2026-09-25.
Frentes relevantes: context recovery, Atlas affinity, RGO, forensic, neural parameters, Octacore G6 e SARA frontier.
Branches abertas não são tratados como MAIN.

## Classificação crítica
| Área | Baseline | MAIN | Classe |
|---|---|---|---|
| app/api/soul-mesh/route.ts | SIM/LEGADO | sim | OK/EXECUTABLE |
| N06Processor | sim | sim | OK/EXECUTABLE |
| N06CapabilityDispatcher | sim | sim | OK/EXECUTABLE |
| N06AgentRegistry | sim | sim | OK |
| Mesh HMAC | sim/histórico | sim | OK |
| contextual capabilities | sim | sim | BLOCKED_ENV/CONTEXT sem sessão |
| Clareira | integração/branch | sim/histórico | INTEGRATED/BRANCH ancestry |
| RGO Trinity | não no MAIN | não | BRANCH_ONLY |

## Deleções/renames
O conector não expõe reconstrução integral de git diff --diff-filter=D/R para toda a história N06. Não foi identificado, na inspeção de entrypoints críticos, arquivo crítico comprovadamente deletado.

## Simulação
Não foi identificado um health falso específico no handler N06; o runtime distingue capability declarada de capability executável. Qualquer fallback de ID/retry não é tratado como medição fisiológica ou health.

## Estado A
AUDITORIA N06: concluída no escopo observável.
LIVE ponta a ponta: NÃO VERIFICADO.
CI do HEAD atual: NÃO MEDIDO.
