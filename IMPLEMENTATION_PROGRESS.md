# Dayflow Sync Progress

## Objetivo
Sincronizar dados entre Dayflow (site), Google Calendar e Notion sem custos recorrentes.

## Estado Atual
- Frontend local-first com dados em localStorage.
- Planner sincroniza blocos com Google Calendar via backend e preserva IDs externos.
- Tasks sincronizam com uma base Notion configurada, com importacao manual e deduplicacao.
- Backend local de autenticacao e sincronizacao implementado em Node, com estado persistente em JSON.

## Progresso Feito Nesta Iteracao
- Analise tecnica do projeto atual concluida.
- Arquitetura gratuita definida:
  - Backend self-hosted (Node) para OAuth e sync.
  - Persistencia local em ficheiros JSON (sem BD paga).
  - Sync incremental e idempotente por `externalId`.

## Em Desenvolvimento
- [x] Backend de sync (Google + Notion).
- [x] Endpoints de autenticacao Google (OAuth).
- [x] Endpoints de sync de time blocks para Google Calendar.
- [x] Endpoints de sync de tasks para Notion.
- [x] Cliente frontend para chamar backend de sync.
- [x] Integracao do Planner no fluxo de sync.
- [x] Integracao de Tasks no fluxo de sync.
- [x] Status de conexao/sync na pagina Settings.
- [x] Metadata de sync persistida por fonte (Google/Notion) com ultimo sucesso/erro.
- [ ] Resolucao de conflitos no merge Dayflow <-> Google/Notion.
- [x] Deteccao de conflito por etag no Google Calendar (com rollback local no Planner e visibilidade em Settings).

## O Que Falta Depois Desta Fase
- [ ] Resolucao de conflitos (edicao simultanea em multiplas fontes).
- [ ] Sync reverso incremental (Google/Notion -> Dayflow) com agendamento.
- [ ] Auditoria de sync e retries com backoff.
- [ ] Testes automatizados para cenarios de deduplicacao e falha de rede.

## Riscos e Mitigacoes
- Tokens OAuth expirados/revogados: guardar refresh token e validar estado de conexao.
- Duplicacao de eventos: usar mapeamento `internalId` <-> `externalId`.
- Alteracoes manuais no Notion: validar schema da base e tratar campos opcionais.
- Timezone: usar `TZ` e converter datas no backend antes de enviar para APIs externas.
