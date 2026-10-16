# AETERNUM M4 — Consciência e Cognição

M4 é um adaptador para o runtime cognitivo real do N06. Esta camada define ciclo de vida e contrato de execução, mas não cria uma resposta sintética para representar raciocínio.

Sem um MindExecutor conectado, o estado é adapter_unbound e execution=not_claimed. Com um executor real, o resultado retornado pelo N06 é propagado sem alteração semântica.

## Infraestrutura

Os módulos de consciência não criam EventBus, HortaCore ou Wormhole privados. Eles expõem um contrato de ConsciousnessInfrastructure e permanecem sem autoridade externa até que um runtime real faça bind explícito.

Antes do bind, inscrições e registros são mantidos apenas como contratos pendentes para permitir inicialização determinística; eles não são executados localmente nem apresentados como runtime ativo.

## Prova

A presença dos módulos e dos contratos não prova integração operacional com N01/N03/N05. A integração somente deve ser marcada como conectada depois de um binding real e de testes que confirmem eventos, estado e registry através da autoridade injetada.
