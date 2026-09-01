# N01 ↔ N06 ↔ N07 — Interface de Fusão

Preparação da fusão final do sistema. O N07 permanece deliberadamente como última peça a ser alterada.

## Estado observado

N01 fornece registry/discovery/delegation e proteção de transporte. N06 fornece capabilities, ferramentas, agentes e execução contextualizada. N07 será o orquestrador final e deverá receber os contratos de entrada/saída dos dois lados sem duplicar ownership.

## Compatibilidade atual

N01 e N06 utilizam `soul-mesh/1` e `contractVersion` `1.1.0`. O N07 possui contrato próprio mais recente. A versão não deve ser alterada unilateralmente antes da fusão. A última etapa deve selecionar um contrato canônico e, quando necessário, implementar adaptadores explícitos e temporários.

## Propriedade

N06 continua proprietário das capabilities e tools que seu runtime realmente executa. N01 continua proprietário da fronteira de registro/descoberta e controles de transporte. N07 coordenará composição, correlação, seleção e encadeamento, mas não deve copiar o runtime do N06 para dentro de si.

## Fluxo final

`request → N01 → N07 → owner capability → N06/tool/runtime → result → N07 → N01 → client`

## Segurança obrigatória

Autenticação/HMAC, replay protection, clock skew, payload limits, rate limiting, authorization por capability e propagação de correlation/trace devem sobreviver à fusão. A ausência de credencial exigida não pode ser convertida silenciosamente em acesso.

## Critério real de conclusão

A fusão só é concluída após execução E2E real entre os três componentes, com ownership correto, identidade do usuário preservada quando exigida, correlação preservada, timeout/cancelamento funcional e métricas suficientes para observar latência e erro.
