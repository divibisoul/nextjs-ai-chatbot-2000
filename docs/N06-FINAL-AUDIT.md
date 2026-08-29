# N06 — Auditoria estrutural final

## Diretrizes consolidadas

N06 permanece uma IA independente, com agentes e capacidades próprias. A Soul Mesh é a única camada de interoperabilidade entre N01–N06. Nenhum segundo Mesh foi criado.

## Estado real auditado

- Identidade N06: ATENDIDO.
- Protocolo `soul-mesh/1`: ATENDIDO e alinhado aos seis núcleos.
- Entrada Mesh: ATENDIDO.
- Execução de capabilities: ATENDIDO por `N06CapabilityDispatcher` e `N06Processor`.
- Agentes: cognitivo, ferramentas e Mesh já existentes.
- Política de autorização: EXISTENTE.
- Limite de passos: EXISTENTE.
- Descoberta de peers: EXISTENTE.
- N01–N05 como peers: EXISTENTE.
- Correlação por `correlationId`: EXISTENTE.
- Proteção de tamanho de payload: EXISTENTE.
- Validação de timestamp: EXISTENTE.
- HMAC: PRIMITIVA + ENDPOINT INTEGRADOS.
- API paralela: NÃO CRIADA.

## Correções aplicadas

1. Removido `ack` do protocolo N06 para coincidir com o contrato canônico do SOUL (`request`, `response`, `event`, `error`).
2. Endurecida a validação de identidade, correlação, capability e timestamp.
3. Adicionada primitiva HMAC-SHA256 com nonce e comparação constant-time.
4. Integrada a verificação HMAC ao endpoint Mesh ativo usando `x-soul-mesh-nonce` e `x-soul-mesh-hmac`.
5. Mantida compatibilidade com ambiente de desenvolvimento sem segredo configurado; produção exige `SOUL_MESH_HMAC_SECRET`.

## Limitação honesta

A integração física simultânea dos seis runtimes não é declarada como validada apenas por inspeção do GitHub. Ela requer os processos implantados e acessíveis simultaneamente.

## Estado

N06 estrutural: 95%.

O núcleo está preparado para integrar-se ao Mesh comum. O restante é comissionamento E2E e harmonização final da autenticação entre todos os núcleos.
