# API REST

Versão do documento: 2.0

Última atualização: Julho/2026 (endpoints de Unidades/Arenas, Planos, Mensagens, Usuários multi-unidade, transferência de aula)

---

# Visão Geral

A API do Sys Belt - Sistema Faixa Preta segue o padrão RESTful utilizando JSON para troca de informações entre frontend e backend.

Content-Type: `application/json`

---

# URL Base

Desenvolvimento: `http://localhost:3333`

Produção: exposta via Netlify Function, acessível pelo frontend em `/api/*` (mesma origem, resolvido por redirect — ver `deploy.md`).

---

# Autenticação

A autenticação utiliza JWT.

```
POST /auth/login → JWT → Authorization: Bearer <token>
```

O token carrega apenas `sub` (id do usuário) e `perfil`. A cada requisição, `ensureAuthenticated` busca o usuário no banco (garante que `ativo` e `perfil` estão sempre atuais) e monta `req.user = { id, perfil, unidadeId }`.

## Header `X-Unidade-Id`

Alguns perfis podem alterar `req.user.unidadeId` para aquela requisição através do header `X-Unidade-Id`:

- **DONO / ADMIN / PROFESSOR / RECEPCAO** vinculados a mais de uma unidade: só é aceito se a unidade pedida estiver entre as vinculadas ao usuário (tabela `UsuarioUnidade`) — usado para trocar a "unidade ativa". O `DONO` alcança todas as unidades da própria conta.

Para qualquer outro caso o header é ignorado.

---

# Perfis

| Perfil | Resumo |
|---|---|
| **DONO** | O dono da academia cliente. Alcança todas as filiais da própria conta e nenhuma de outra; gerencia unidades e vínculos de usuário. |
| **ADMIN** | Gestão completa da(s) própria(s) unidade(s). |
| **PROFESSOR** | Pedagógico, aulas, graduações, competições; dados de Aluno redigidos; pode estar vinculado a mais de uma unidade. |
| **RECEPCAO** | Cadastros, financeiro, mensalidades, mensagens, relatórios da própria unidade. |

Nas tabelas abaixo, "Perfis" lista quem passa em `ensureRole(...)`. O `DONO`
passa em tudo que o `ADMIN` passa, por herança declarada em
`PERFIS_QUE_HERDAM` (`src/shared/constants/perfis.ts`) — por isso ele nem
sempre aparece listado.

> **Perfil legado:** `SUPERADMIN` não existe mais. O operador do SaaS trabalha
> no Control Plane, com autenticação própria. Usuários com esse perfil em
> bancos anteriores à separação dos planos são recusados no login e em toda
> requisição autenticada, com HTTP 403 e a mensagem "Operadores da plataforma
> devem acessar o Control Plane".

---

# Códigos HTTP

`200` Sucesso · `201` Criado · `400` Dados inválidos · `401` Não autenticado · `403` Sem permissão · `404` Não encontrado · `500` Erro interno.

---

# Formato das respostas

Sucesso: o corpo do recurso diretamente (objeto ou array), sem envelope `data`.

Erro:

```json
{ "message": "Descrição do erro" }
```

---

# Autenticação — `/auth`

## POST /auth/login

Pública.

```json
{ "email": "admin@sgcl.com", "senha": "123456" }
```

Resposta: `{ "usuario": { id, nome, email, perfil, unidadeId, unidadeNome }, "token": "JWT" }`

## POST /auth/register

Perfis: ADMIN (e DONO, por herança).

```json
{
  "nome": "", "email": "", "senha": "", "perfil": "ADMIN",
  "unidadeId": 1,
  "unidadeIds": [1, 2]
}
```

- `perfil` aceita apenas `DONO`, `ADMIN`, `PROFESSOR` ou `RECEPCAO`.
- Um ADMIN comum sempre cadastra dentro da própria unidade (`unidadeId`/`unidadeIds` do body são ignorados).
- `unidadeIds` vincula o usuário a mais de uma filial **da mesma conta**. Uma lista que misture unidades de contas diferentes é recusada inteira, em vez de ter as unidades inválidas silenciosamente descartadas.

---

# Unidades — `/unidades`

| Método | Rota | Perfis | Descrição |
|---|---|---|---|
| POST | `/` | DONO, ADMIN | Cadastra unidade |
| GET | `/` | DONO, ADMIN | Lista unidades (completo) |
| GET | `/opcoes` | ADMIN, PROFESSOR | Lista enxuta (id/nome) — popula o seletor de consulta de grade de outra unidade |
| PUT | `/:id` | DONO, ADMIN | Atualiza unidade |
| PATCH | `/:id/ativo` | DONO, ADMIN | Ativa/inativa |

---

# Arenas — `/arenas`

| Método | Rota | Perfis | Descrição |
|---|---|---|---|
| POST | `/` | ADMIN | Cadastra arena na própria unidade |
| GET | `/` | ADMIN, RECEPCAO | Lista arenas da unidade |
| PUT | `/:id` | ADMIN | Atualiza (só `nome` — não permite re-vincular a outra unidade) |
| PATCH | `/:id/ativo` | ADMIN | Ativa/inativa |

---

# Usuários — `/usuarios`

| Método | Rota | Perfis | Descrição |
|---|---|---|---|
| GET | `/` | ADMIN | Lista usuários da unidade |
| GET | `/professores` | ADMIN, PROFESSOR | Lista enxuta de professores — usada no seletor de professor substituto |
| GET | `/minhas-unidades` | ADMIN, PROFESSOR, RECEPCAO | Unidades vinculadas ao usuário autenticado — popula o seletor de "unidade ativa" |
| PUT | `/:id` | ADMIN | Atualiza usuário (`unidadeIds` alcança as filiais da própria conta) |
| PATCH | `/:id/perfil` | ADMIN | Troca perfil entre `DONO`, `ADMIN`, `PROFESSOR` e `RECEPCAO` |
| PATCH | `/:id/ativo` | ADMIN | Ativa/inativa |

---

# Alunos — `/alunos`

| Método | Rota | Perfis | Descrição |
|---|---|---|---|
| POST | `/` | ADMIN, RECEPCAO | Cadastro |
| GET | `/` | ADMIN, PROFESSOR, RECEPCAO | Lista — **redigido** para PROFESSOR (só nome/apelido/turma/responsáveis) |
| GET | `/aniversariantes` | ADMIN, RECEPCAO | Aniversariantes do mês |
| GET | `/:id/prontuario` | ADMIN, RECEPCAO | Prontuário completo (bloqueado para PROFESSOR) |
| GET | `/:id` | ADMIN, PROFESSOR, RECEPCAO | Detalhe — **redigido** para PROFESSOR |
| PUT | `/:id` | ADMIN, RECEPCAO | Atualiza |
| PATCH | `/:id/ativo` | ADMIN, RECEPCAO | Ativa/inativa |

Corpo do cadastro (exemplo mínimo):

```json
{ "nome": "Pedro", "dataNascimento": "2016-10-08", "telefone": "61999999999", "turmaId": 1 }
```

---

# Responsáveis — `/responsaveis`

| Método | Rota | Perfis |
|---|---|---|
| POST | `/` | ADMIN, RECEPCAO |
| GET | `/` | ADMIN, PROFESSOR, RECEPCAO |
| GET | `/:id` | ADMIN, PROFESSOR, RECEPCAO |
| GET | `/aluno/:alunoId` | ADMIN, PROFESSOR, RECEPCAO |
| PUT | `/:id` | ADMIN, RECEPCAO |
| PATCH | `/:id/ativo` | ADMIN, RECEPCAO |
| DELETE | `/:id` | ADMIN |

---

# Turmas — `/turmas`

| Método | Rota | Perfis |
|---|---|---|
| POST | `/` | ADMIN, RECEPCAO |
| GET | `/` | ADMIN, PROFESSOR, RECEPCAO |
| GET | `/:id` | ADMIN, PROFESSOR, RECEPCAO |
| PUT | `/:id` | ADMIN, RECEPCAO |
| PATCH | `/:turmaId/alunos/:alunoId` | ADMIN, RECEPCAO — vincula aluno à turma |
| PATCH | `/:id/ativo` | ADMIN, RECEPCAO |

PROFESSOR tem acesso somente de consulta (GET) — não cria/edita turma, nem vincula aluno.

---

# Aulas — `/aulas`

| Método | Rota | Perfis | Descrição |
|---|---|---|---|
| POST | `/` | ADMIN, PROFESSOR | Inicia aula avulsa |
| GET | `/` | ADMIN, PROFESSOR, RECEPCAO | Lista aulas realizadas |
| GET | `/resumo-turmas` | ADMIN, PROFESSOR, RECEPCAO | Resumo por turma (query `periodo`) |
| GET | `/:id` | ADMIN, PROFESSOR, RECEPCAO | Detalhe |
| PUT | `/:id` | ADMIN, PROFESSOR | Atualiza jogos/técnicas realizadas |
| PATCH | `/:id/finalizar` | ADMIN, PROFESSOR | Finaliza a aula |
| DELETE | `/:id` | ADMIN | Remove |
| PUT | `/alunos/:id` | ADMIN, PROFESSOR | Atualiza chamada de um aluno (presença/comportamento) |
| POST | `/programadas` | ADMIN, PROFESSOR | Programa uma aula |
| POST | `/programadas/replicar` | ADMIN, PROFESSOR | Replica programação em várias datas |
| GET | `/programadas` | ADMIN, PROFESSOR, RECEPCAO | Lista programações (query `turmaId`, `periodo`, `unidadeConsultaId`) |
| GET | `/programadas/resumo-turmas` | ADMIN, PROFESSOR, RECEPCAO | Resumo por turma |
| GET | `/grade-semanal` | ADMIN, PROFESSOR, RECEPCAO | Grade da semana (query `data`, `unidadeConsultaId`) |
| PUT | `/programadas/:id` | ADMIN, PROFESSOR | Edita data/plano/observações |
| PATCH | `/programadas/:id/iniciar` | ADMIN, PROFESSOR | Vira uma Aula real (abre chamada) |
| PATCH | `/programadas/:id/cancelar` | ADMIN, PROFESSOR | Cancela |
| PATCH | `/programadas/:id/transferir` | ADMIN, PROFESSOR | Transfere para outro professor |
| DELETE | `/programadas/:id` | ADMIN | Remove |

`unidadeConsultaId` (query, em `/programadas` e `/grade-semanal`): consulta somente leitura da grade de outra unidade, disponível para ADMIN/PROFESSOR — não altera o escopo do usuário em nenhuma outra rota (mecanismo diferente do header `X-Unidade-Id`).

Corpo de `PATCH /aulas/programadas/:id/transferir`:

```json
{ "professorSubstitutoId": 7, "motivo": "Professor titular em atestado médico." }
```

---

# Currículo — `/curriculos`

| Método | Rota | Perfis |
|---|---|---|
| POST / GET / PUT `/`, `/:id` | | ADMIN, PROFESSOR |
| POST / PUT `/modulos`, `/modulos/:id` | | ADMIN, PROFESSOR |
| POST / PUT `/aulas`, `/aulas/:id` | | ADMIN, PROFESSOR |
| POST / PUT `/tecnicas`, `/tecnicas/:id` | | ADMIN, PROFESSOR |
| DELETE | `/:id` | ADMIN |

---

# Técnicas — `/tecnicas`

| Método | Rota | Perfis |
|---|---|---|
| POST | `/` | ADMIN, PROFESSOR |
| GET | `/` | ADMIN, PROFESSOR, RECEPCAO |

---

# Comportamentos — `/comportamentos`

| Método | Rota | Perfis |
|---|---|---|
| POST | `/` | ADMIN, PROFESSOR |
| GET | `/` | ADMIN, PROFESSOR |
| GET | `/resumo/:alunoId` | ADMIN, PROFESSOR |

---

# Graduações — `/graduacoes`

| Método | Rota | Perfis |
|---|---|---|
| POST | `/` | ADMIN, PROFESSOR |
| POST | `/grau` | ADMIN, PROFESSOR — incrementa grau |
| GET | `/` | ADMIN, PROFESSOR, RECEPCAO |
| GET | `/aluno/:id` | ADMIN, PROFESSOR, RECEPCAO |
| GET | `/proximas` | ADMIN, PROFESSOR, RECEPCAO |
| GET | `/evolucao/:alunoId` | ADMIN, PROFESSOR, RECEPCAO |

---

# Mensalidades — `/mensalidades`

| Método | Rota | Perfis |
|---|---|---|
| POST | `/` | ADMIN, RECEPCAO |
| GET | `/` | ADMIN, RECEPCAO |
| GET | `/vencidas` | ADMIN, RECEPCAO |
| GET | `/:id` | ADMIN, RECEPCAO |
| PATCH | `/:id/pagar` | ADMIN |

---

# Planos — `/planos`

| Método | Rota | Perfis |
|---|---|---|
| POST | `/` | ADMIN |
| GET | `/` | ADMIN, PROFESSOR, RECEPCAO |
| PUT | `/:id` | ADMIN |
| PATCH | `/:id/ativo` | ADMIN |

---

# Financeiro — `/financeiro`

| Método | Rota | Perfis |
|---|---|---|
| GET | `/resumo` | ADMIN |

---

# Competições — `/competicoes`

| Método | Rota | Perfis |
|---|---|---|
| POST | `/` | ADMIN, PROFESSOR |
| GET | `/` | ADMIN, PROFESSOR, RECEPCAO |
| POST | `/inscricao` | ADMIN, PROFESSOR |
| GET | `/:id/atletas` | ADMIN, PROFESSOR, RECEPCAO |
| PATCH | `/inscricao/:id` | ADMIN, PROFESSOR — registra resultado |
| DELETE | `/:id` | ADMIN |

---

# Avisos — `/avisos`

| Método | Rota | Perfis |
|---|---|---|
| GET | `/` | ADMIN, RECEPCAO |
| POST | `/reconhecer` | ADMIN, RECEPCAO |

---

# Mensagens — `/mensagens`

Geração de textos prontos para envio manual (WhatsApp, etc.).

| Método | Rota | Perfis |
|---|---|---|
| GET | `/lembrete-semanal` | ADMIN, RECEPCAO |
| GET | `/lembrete-vencimento` | ADMIN, RECEPCAO |
| GET | `/lembrete-atraso` | ADMIN, RECEPCAO |
| GET | `/relatorio-mensal` | ADMIN, RECEPCAO |
| GET | `/congratulacoes-graduacao` | ADMIN, RECEPCAO |
| GET | `/ausencia` | ADMIN, RECEPCAO |

---

# Relatórios — `/relatorios`

| Método | Rota | Perfis |
|---|---|---|
| GET | `/evolucao/:alunoId` | ADMIN, RECEPCAO |
| GET | `/financeiro` | ADMIN, RECEPCAO |
| GET | `/ranking` | ADMIN, RECEPCAO |
| GET | `/aniversariantes` | ADMIN, RECEPCAO |
| GET | `/comportamental/:alunoId` | ADMIN, RECEPCAO |

---

# Dashboard — `/dashboard`

| Método | Rota | Perfis |
|---|---|---|
| GET | `/` | ADMIN |
| GET | `/periodo` | ADMIN |

---

# Uploads — `/uploads`

| Método | Rota | Perfis |
|---|---|---|
| POST | `/` | ADMIN, PROFESSOR, RECEPCAO — multipart, campo `arquivo` (máx. 5MB) |
| GET | `/:prefixo/:arquivo` | qualquer autenticado |

---

# Headers

```
Authorization: Bearer <token>
Content-Type: application/json
X-Unidade-Id: <id>   (opcional — ver seção "Header X-Unidade-Id")
```

---

# Convenções

- Recursos no plural: `/alunos`, `/turmas`, `/usuarios`.
- Nunca usar POST para atualização — sempre PUT (substituição) ou PATCH (alteração parcial de estado, ex. `/ativo`).

---

# Cobertura deste documento

Este documento descreve os módulos fundacionais. Os endpoints listados são
verificáveis contra `src/modules/*/routes.ts`, que é sempre a fonte da
verdade em caso de divergência.

**Ainda não documentados aqui**, embora implementados: `pagamentos`,
`assinaturas`, `contratos`, `modelosContrato`, `assinaturaEletronica`,
`notificacoes`, `portalFamilia`, `portalProfessor`, `mensagensFamilia`,
`publico`, `leads`, `whatsapp`, `controleAcesso`, `consentimentos`, `loja`,
`eventos`, `metas`, `fotosTreino`, `formasPagamento`, `modalidades`,
`concessaoPlataforma` e `integracaoControlPlane`.

A API do Control Plane é separada e está descrita em
[`control-plane-b2b.md`](control-plane-b2b.md).

---

# Plataforma — `/plataforma`

| Método | Rota | Perfis | Descrição |
|---|---|---|---|
| GET | `/minha-assinatura` | ADMIN (e DONO) | Plano vigente, contagem de alunos por unidade, prévia do mês e histórico de faturas |

É o **único** endpoint de plataforma exposto no Tenant Plane. Planos,
assinantes, cobrança e fechamento pertencem exclusivamente ao Control Plane —
manter os dois lados capazes de escrever o mesmo dado comercial criaria
divergência sem fonte da verdade.

A prévia do mês é calculada na hora, não lida de fatura, justamente para
responder "se eu matricular mais 3 alunos, muda meu preço?".

---

# Futuro

Esta documentação será utilizada como base para gerar a especificação OpenAPI (Swagger), permitindo testes automatizados de contrato e integração com aplicações externas.
