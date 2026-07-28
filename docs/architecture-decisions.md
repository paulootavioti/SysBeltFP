# Sys Belt — Architecture Decision Records

## ADR-001 — Separação entre Backend e Frontend

Data: 25/06/2026

### Decisão

O Sys Belt será dividido em dois projetos:

- sgcl-api
- sgcl-web

### Motivação

Separar responsabilidades entre API e interface, facilitando manutenção, deploy e evolução independente.

### Impacto

O backend expõe uma API REST e o frontend consome essa API via Axios.

Status: Aceito.

---

## ADR-002 — Uso de JWT para autenticação

Data: 25/06/2026

### Decisão

A autenticação será baseada em JWT.

### Motivação

Permitir autenticação stateless, compatível com aplicações web modernas.

### Impacto

Todas as rotas protegidas exigem token no header Authorization.

Status: Aceito.

---

## ADR-003 — Controle de acesso por perfil

Data: 25/06/2026

### Decisão

O sistema terá perfis de acesso:

- SUPERADMIN
- ADMIN
- PROFESSOR
- RECEPCAO

### Motivação

Cada usuário deve acessar apenas as funcionalidades compatíveis com sua função. SUPERADMIN foi adicionado posteriormente (Julho/2026, ver ADR-010) como o único perfil sem vínculo obrigatório a uma unidade, com acesso irrestrito a todas.

### Impacto

As rotas usam middlewares de autenticação e autorização (`ensureRole`), que sempre liberam SUPERADMIN incondicionalmente antes de checar os demais perfis.

Status: Aceito.

---

## ADR-004 — Faixa não é alterada pelo cadastro do aluno

Data: 25/06/2026

### Decisão

A faixa do aluno não será alterada pela edição cadastral.

### Motivação

A faixa representa evolução técnica e deve ser controlada pelo módulo de Graduações.

### Impacto

O endpoint de edição do aluno atualiza apenas dados cadastrais.

Status: Aceito.

---

## ADR-005 — Criação de Design System próprio

Data: 25/06/2026

### Decisão

O frontend terá componentes reutilizáveis próprios.

### Motivação

Garantir consistência visual, reduzir duplicação de código e facilitar evolução.

### Impacto

Novas telas devem priorizar componentes reutilizáveis antes de CSS inline.

Status: Aceito.

---

## ADR-006 — Arquitetura modular por domínio

Data: 25/06/2026

### Decisão

Backend e frontend são organizados em módulos por domínio de negócio (alunos, aulas, mensalidades, graduações, etc.), cada um com sua própria pasta autocontida.

### Motivação

Separar responsabilidades por domínio, facilitando localizar e evoluir cada funcionalidade sem impactar as demais.

### Impacto

Cada módulo do backend segue o padrão `controller.ts` / `routes.ts` / `services/`; cada módulo do frontend segue `pages/` / `components/` / `services/` / `hooks/` / `types/` / `schema/`.

Status: Aceito.

---

## ADR-007 — React Hook Form + Zod para formulários

Data: 25/06/2026

### Decisão

Todos os formulários do frontend usam React Hook Form para controle de estado e Zod para validação, via `zodResolver`.

### Motivação

Padronizar validação e reduzir boilerplate de formulários controlados manualmente.

### Impacto

Todo formulário novo deve seguir o padrão `useForm` + `FormProvider` + schema Zod dedicado.

Status: Aceito.

---

## ADR-008 — Camada de Service/ApiClient no frontend

Data: 25/06/2026

### Decisão

Nenhuma página ou componente chama axios/fetch diretamente; toda chamada HTTP passa por uma classe Service do módulo, que por sua vez usa o ApiClient compartilhado.

### Motivação

Isolar a página da forma como os dados são buscados, facilitando troca de implementação e testes.

### Impacto

Páginas dependem apenas de `Service.metodo()`; o ApiClient centraliza o tratamento de resposta do Axios.

Status: Aceito.

---

## ADR-009 — Regra de negócio apenas em Services (backend)

Data: 25/06/2026

### Decisão

Controllers do backend não contêm lógica de negócio; toda regra fica em uma classe Service dedicada por ação.

### Motivação

Manter Controllers finos (apenas leem request e devolvem response), facilitando reuso e teste da lógica de negócio isoladamente.

### Impacto

Cada ação de Controller instancia e chama um XxxService, nunca acessa o Prisma diretamente.

Status: Aceito.

---

## ADR-010 — Multi-tenant via coluna `unidadeId`, não schema por academia

Data: Julho/2026

### Decisão

O isolamento entre unidades (filiais) é feito através de uma coluna `unidadeId` em cada entidade operacional, filtrada centralizadamente por `escopoUnidade()`/`garantirAcessoUnidade()` — não através de um schema/banco separado por unidade, nem por um schema separado por academia.

### Motivação

Um schema por tenant multiplicaria a complexidade operacional (migrations, backups, conexões) para um volume de dados que não justifica o isolamento físico. A coluna `unidadeId` com índice e filtro centralizado dá isolamento lógico suficiente com uma fração do custo de manutenção.

### Impacto

Todo Service que lista/busca uma entidade precisa aplicar `escopoUnidade(unidadeId)`; esquecer esse filtro é uma classe de bug real (vazamento de dados entre unidades) — por isso o padrão é centralizado em um utilitário único em vez de repetido manualmente em cada Service.

Status: Aceito.

---

## ADR-011 — Escopo trocado por header, não por rota separada

Data: Julho/2026

### Decisão

Quando o SUPERADMIN quer "visualizar como" uma unidade específica, ou um usuário multi-unidade quer trocar sua "unidade ativa", isso é feito através de um header HTTP (`X-Unidade-Id`) interpretado por `ensureAuthenticated`, que sobrescreve `req.user.unidadeId` só para aquela requisição.

### Motivação

Como todo o sistema já filtra por `req.user.unidadeId`, esse único ponto de entrada evita qualquer mudança nos ~20 módulos existentes — nenhum Service precisou ser alterado para suportar "ver como outra unidade".

### Impacto

- SUPERADMIN: o header é irrestrito.
- ADMIN/PROFESSOR/RECEPCAO vinculados a mais de uma unidade: o header só é aceito se a unidade pedida estiver na lista de unidades vinculadas do usuário (tabela `UsuarioUnidade`) — validado a cada requisição.
- Qualquer outro perfil: o header é ignorado.

Status: Aceito.

---

## ADR-012 — Redação de campos por perfil dentro do Service, nunca só na UI

Data: Julho/2026

### Decisão

Quando um perfil (hoje, PROFESSOR) só pode ver um subconjunto dos campos de uma entidade (Aluno), essa restrição é implementada como um `select` diferente do Prisma dentro do próprio Service, condicionado a `req.user.perfil` — não como uma máscara aplicada no frontend sobre um payload completo.

### Motivação

Esconder campos só na UI não impede a leitura do payload completo pela aba de rede do navegador. A restrição só é real quando o dado nunca sai do banco para aquele perfil.

### Impacto

Qualquer nova tela com dados sensíveis por perfil deve seguir o mesmo padrão: branch por perfil dentro do Service (ex.: `ListAlunosService`, `GetAlunoCompletoService`), nunca um filtro só no componente React.

Status: Aceito.

---

## ADR-013 — Transferência de aula como campos extras em `AulaProgramada`, não uma nova entidade

Data: Julho/2026

### Decisão

A transferência de uma aula programada para outro professor (quando o titular está impedido) é modelada como dois campos opcionais em `AulaProgramada` (`professorSubstitutoId`, `motivoTransferencia`), não como uma entidade `TransferenciaAula` separada.

### Motivação

A transferência vale só para aquela ocorrência específica da aula — não altera o professor titular da turma, nem precisa de histórico de múltiplas transferências por ocorrência (a última transferência sempre substitui a anterior). Uma entidade separada adicionaria uma junção sem trazer benefício real para esse caso de uso.

### Impacto

Se no futuro for necessário manter histórico de todas as transferências de uma mesma aula (não só a última), esses campos precisarão migrar para uma tabela própria.

Status: Aceito.

---

## ADR-014 — Usuário multi-unidade: tabela de junção + "unidade ativa" no próprio `Usuario`

Data: Julho/2026

### Decisão

Um usuário (Admin, Professor ou Recepção) vinculado a mais de uma unidade tem suas unidades permitidas guardadas em uma tabela de junção (`UsuarioUnidade`), enquanto `Usuario.unidadeId` continua sendo um único campo — a "unidade ativa" no momento.

### Motivação

Alternativa considerada: carregar a lista de unidades permitidas dentro do JWT. Rejeitada porque a lista poderia mudar (SUPERADMIN adiciona/remove unidade do usuário) sem que o token expirasse, exigindo revogação; como `ensureAuthenticated` já busca o usuário no banco a cada requisição (ADR-002), validar a unidade pedida contra `UsuarioUnidade` nesse mesmo ponto não adiciona uma consulta extra relevante.

Manter uma "unidade ativa" única (em vez de o usuário sempre precisar escolher explicitamente) preserva 100% de compatibilidade com todo o código existente, que já espera `req.user.unidadeId` como um valor único.

### Impacto

Trocar a unidade ativa é feito pelo mesmo mecanismo de header do ADR-011, validado contra `UsuarioUnidade`. Promover um usuário a SUPERADMIN limpa `unidadeId` e todos os vínculos (SUPERADMIN nunca pertence a uma unidade).

Status: Aceito.