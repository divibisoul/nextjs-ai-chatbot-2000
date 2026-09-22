# N06 ↔ SARA

## Configuração server-side

- SARA_ENABLE_CHAT=true
- SARA_BASE_URL=https://<sara-host>
- SARA_API_TOKEN=<segredo>

## Fluxo

1. usuário envia mensagem;
2. N06 executa a autenticação e persistência existentes;
3. a mensagem textual é submetida ao `POST /v1/cycle`;
4. N06 recebe ciclo, estado final, convergência, rollback e evidência;
5. o contexto regenerativo é incorporado à geração;
6. a execução cognitiva e o streaming continuam pertencendo ao N06.

Além de `sara.cycle`, o cliente server-side agora expõe, de forma aditiva, `sara.health`, `sara.capabilities`, `sara.state`, `sara.audit`, `sara.regenerate` e o fluxo de rastreabilidade compatível com o restante da federação. Isso permite que N06 use a semelhança funcional entre cognição, auditoria e governança sem absorver a propriedade dos módulos do SARA.

SARA permanece autoridade exclusiva do seu ciclo regenerativo. N06 não duplica ARA, ETR ou ITR.
