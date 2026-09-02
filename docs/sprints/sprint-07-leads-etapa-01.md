# Sprint 07 - Leads e funil de vendas - Etapa 1

## Entregue

- evolução do modelo legado de Lead para o funil comercial completo;
- canal de captação por unidade com slug público globalmente único;
- timeline imutável e consentimentos LGPD versionados;
- migration progressiva com preservação dos leads antigos e rollback documentado;
- `GET /public/captacao/:slug` com dados públicos mínimos;
- `POST /public/captacao/:slug/leads` com resposta genérica;
- normalização brasileira para E.164 e deduplicação em todas as filiais da Conta;
- deduplicação contra alunos, responsáveis e leads;
- identificação de aluno inativo como ex-aluno, sem novo cadastro;
- rate limit por IP e telefone, honeypot e validação Zod;
- SLA inicial de 15 minutos e evento de captação;
- consentimento obrigatório de dados e consentimento opcional de comunicações;
- listagem autenticada paginada e filtrável por estágio;
- leitura de leads liberada ao Professor; escrita de canais restrita a Admin/Recepção;
- página pública mobile-first em `landing-academia/captacao.html`;
- canal inicial criado pelo seed em ambientes novos.

## Rotas autenticadas

- `GET /leads?estagio=&pagina=&limite=`;
- `GET /leads/canais`;
- `POST /leads/canais`;
- `PUT /leads/canais/:id`.

## Teste local

- formulário: `http://localhost:5177/captacao.html?canal=landing-principal`;
- painel: `http://localhost:5173/leads`;
- API: `http://localhost:3333`.

## Pendente para as próximas etapas

- Etapa 2: Kanban, atribuição por rodízio, gestão visual dos canais, SLA no dashboard, detalhe e timeline operacional;
- Etapa 3: conversão transacional e reativação do ex-aluno;
- Etapa 4: métricas por canal e campanha.

## Decisões para a Etapa 2

- definir a estratégia de QR Code antes da gestão visual de canais;
- manter drag and drop sem biblioteca nova, com alternativa acessível por comando de estágio.
