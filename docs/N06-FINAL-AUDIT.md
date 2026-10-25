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

## Estado atual após a reabertura das áreas congeladas

- Os módulos de consciência permanecem presentes e sem exclusão do legado.
- EventBus, HortaCore e Wormhole privados do overlay de consciência foram removidos; N06 agora exige binding explícito de infraestrutura externa.
- O contrato de infraestrutura possui testes para confirmar que o runtime fornecido pelo núcleo proprietário é a única autoridade.
- A integração física simultânea dos runtimes ainda não é declarada como E2E comprovada somente pela inspeção dos repositórios.
- O percentual histórico de 95% foi mantido abaixo apenas como referência histórica e não deve ser usado como estado atual.

### Referência histórica

O relatório anterior registrava “N06 estrutural: 95%”. Esse número era uma estimativa de engenharia de uma etapa anterior e não representa a medição atual. O estado atual é descrito por evidência e gates, sem percentual sintético.
