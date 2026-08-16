# Segurança

Versão: 2.0

Última atualização: Julho/2026 (matriz de permissões dos 4 perfis, isolamento multi-unidade, redação de dados por perfil)

---

# Objetivo

Este documento define todas as diretrizes de segurança adotadas pelo Sys Belt - Sistema Faixa Preta.

Seu objetivo é proteger:

- dados dos alunos;
- dados dos responsáveis;
- informações financeiras;
- registros pedagógicos;
- usuários do sistema;
- infraestrutura da aplicação.

---

# Princípios

Toda funcionalidade do Sys Belt deve obedecer aos seguintes princípios:

- Confidencialidade
- Integridade
- Disponibilidade
- Rastreabilidade
- Menor privilégio

---

# Arquitetura de Segurança

Usuário

↓

Login

↓

JWT

↓

Middleware

↓

Controller

↓

Service

↓

Prisma

↓

Banco

---

# Autenticação

O sistema utiliza:

JWT (JSON Web Token)

---

Fluxo

Login

↓

Validação

↓

Geração do Token

↓

Frontend

↓

Authorization Bearer

↓

API

---

# Senhas

As senhas nunca são armazenadas em texto.

Algoritmo

bcrypt

Biblioteca

bcryptjs

---

Exemplo

Senha

↓

Hash

↓

Banco

---

# Política de Senhas

Recomendada

Mínimo

8 caracteres

Recomenda-se conter:

- letras maiúsculas
- letras minúsculas
- números
- caracteres especiais

---

# JWT

Informações contidas

id do usuário

perfil

expiração

---

Nunca armazenar

senha

dados pessoais

informações financeiras

---

# Expiração

Padrão

7 dias

Configurável via:

JWT_EXPIRES_IN

---

# Variáveis Sensíveis

Nunca devem ser enviadas ao Git.

Exemplos

DATABASE_URL

JWT_SECRET

SMTP_PASSWORD

AWS_SECRET

PIX_TOKEN

---

Todas ficam em:

.env

---

# Controle de Acesso

O sistema possui quatro perfis. A tabela abaixo resume o que cada um acessa — detalhamento completo (RN-160 a RN-194) em `regras-de-negocio.md`.

| Perfil | Escopo | Acesso |
|---|---|---|
| **SUPERADMIN** | Todas as unidades | Irrestrito. Único perfil que cadastra Unidades, cria outro SUPERADMIN e vincula usuários a múltiplas unidades. Bypassa toda checagem de `ensureRole`. |
| **ADMIN** | Própria(s) unidade(s) — pode ter mais de uma | Gestão completa: Alunos, Turmas, Aulas, Arenas, Usuários (Professor/Recepção da própria unidade), Financeiro, Relatórios, Mensagens, Planos, Competições. Consulta (leitura) da grade de outras unidades. |
| **PROFESSOR** | Pode estar vinculado a mais de uma unidade | Aulas (agendar, iniciar, chamada, transferir), Planejamento Pedagógico, Graduações, Competições, Planos (consulta), Turmas (consulta). **Sem** acesso a Relatórios, Mensagens, Unidades/Arenas, Financeiro, Mensalidades. Dados do Aluno **redigidos** (ver seção própria abaixo). |
| **RECEPCAO** | Própria unidade | Alunos, Turmas, Aulas, Mensalidades, Graduações, Competições, Planos, Mensagens, Relatórios. **Sem** acesso a Planejamento Pedagógico nem Financeiro. |

---

# Isolamento Multi-Unidade (Multi-Tenant)

Toda entidade operacional carrega `unidadeId`. O escopo é resolvido centralizadamente em `ensureAuthenticated` e aplicado pelos utilitários `escopoUnidade()` / `garantirAcessoUnidade()` — nenhum Service filtra manualmente.

## Unidade ativa e header `X-Unidade-Id`

- **SUPERADMIN**: pode enviar o header `X-Unidade-Id` para "visualizar como" qualquer unidade específica; sem o header, enxerga todas.
- **ADMIN / PROFESSOR / RECEPCAO** vinculados a mais de uma unidade (tabela `UsuarioUnidade`): podem enviar o mesmo header para trocar a própria "unidade ativa" — mas só é aceito se a unidade pedida estiver entre as que o usuário de fato tem vínculo. Uma tentativa de informar uma unidade não vinculada é silenciosamente ignorada (mantém a unidade ativa atual).
- Qualquer outro perfil: o header é ignorado.

Esse mecanismo troca o escopo de uma requisição sem exigir nenhuma mudança nos Services — todos já filtram por `req.user.unidadeId`.

## Consulta somente leitura entre unidades

ADMIN e PROFESSOR também podem consultar (**somente leitura**) a grade horária de outra unidade através do parâmetro de query `unidadeConsultaId` (rotas `/aulas/programadas` e `/aulas/grade-semanal`) — mecanismo independente do `X-Unidade-Id`: não altera o escopo do usuário em nenhuma outra rota, serve só para essa consulta pontual.

---

# Redação de Dados por Perfil

O perfil PROFESSOR só pode ver do Aluno: **nome, apelido, nome do responsável, turma, presenças e graduações**.

Essa restrição é aplicada no backend, não na UI: o `select` do Prisma em `ListAlunosService` e `GetAlunoCompletoService` é montado de forma diferente quando `req.user.perfil === "PROFESSOR"`, omitindo CPF, endereço, contato, dados de saúde, financeiro e comportamentos desde a query — o campo nunca chega a sair do banco para esse perfil. A rota de prontuário completo (`GET /alunos/:id/prontuario`) é bloqueada inteiramente para PROFESSOR.

Esse é o primeiro mecanismo de redação de campos por perfil do sistema; qualquer nova tela com dados sensíveis de Aluno deve seguir o mesmo padrão (branch por perfil dentro do Service, nunca apenas escondendo campos no frontend).

---

# Middleware

Toda rota protegida utiliza:

ensureAuthenticated

↓

ensureRole

---

# Princípio do Menor Privilégio

Todo usuário recebe apenas as permissões necessárias para executar sua função.

Nunca conceder permissões administrativas desnecessariamente.

---

# Tratamento de Erros

Nunca retornar:

Stack Trace

SQL

Prisma Errors

JWT Secret

Caminhos internos

---

Sempre retornar mensagens amigáveis.

Exemplo

```
{
  "message":"Usuário não encontrado."
}
```

---

# SQL Injection

O Prisma ORM protege automaticamente contra SQL Injection.

Nunca concatenar SQL manualmente.

Correto

Prisma

Errado

String SQL

---

# XSS

Todo conteúdo exibido na interface deve ser tratado pelo React.

Nunca utilizar:

dangerouslySetInnerHTML

sem sanitização.

---

# CSRF

Como a API utiliza JWT no Header Authorization, o risco de CSRF é reduzido.

Ainda assim:

- validar origem das requisições;
- utilizar HTTPS.

---

# CORS

Permitir apenas domínios autorizados.

Exemplo

```
http://localhost:5173
```

Produção

```
https://sgcl.com.br
```

---

# Dados Sensíveis

São considerados sensíveis:

CPF

RG

Telefone

Endereço

Dados médicos

Mensalidades

Observações

Esses dados devem ser acessados apenas por usuários autorizados. Ver seção "Redação de Dados por Perfil" para o mecanismo de enforcement no backend (hoje aplicado ao Aluno para o perfil PROFESSOR).

---

# LGPD

O sistema deve atender aos princípios da Lei Geral de Proteção de Dados.

Diretrizes

- minimização de dados;
- finalidade definida;
- segurança;
- rastreabilidade;
- transparência.

---

# Logs

Nunca registrar:

Senhas

JWT

Hash

Dados médicos

CPF completo

Connection strings ou credenciais de banco

Segredos de integração entre Tenant Plane e Control Plane

O tratador global converte erros inesperados em uma estrutura sanitizada antes
de enviá-los ao console. URLs PostgreSQL, tokens Bearer e o segredo do
diretório são substituídos por marcadores de redação; o objeto `Error` bruto
nunca deve ser registrado.

---

Registrar apenas:

Data

Usuário

Operação

Módulo

Resultado

---

# Auditoria

Estrutura prevista

Tabela

Auditoria

Campos

Usuário

Data

Ação

Entidade

ID

Valores anteriores

Valores novos

---

# Histórico de Correções de Segurança

## Julho/2026

- **Cadastro de usuário público**: a rota `POST /auth/register` não exigia autenticação nem perfil, permitindo que qualquer pessoa criasse uma conta com perfil ADMIN. Corrigido para exigir `ensureAuthenticated` + `ensureRole(["ADMIN"])`.
- **Financeiro restrito indevidamente**: `GET /financeiro/resumo` aceitava apenas ADMIN, contrariando esta própria documentação (que definia RECEPÇÃO com acesso a Financeiro). Corrigido na época para `ensureRole(["ADMIN", "RECEPCAO"])` — **revisto posteriormente** (ver entrada de RBAC abaixo): a regra de negócio mudou e RECEPÇÃO deixou de ter acesso a Financeiro.

## Julho/2026 — Multi-unidade e matriz de permissões (RBAC)

- Nenhum usuário além do SUPERADMIN podia ser criado como SUPERADMIN — `POST /auth/register` corrigido para aceitar `perfil: "SUPERADMIN"` somente quando quem cadastra já é SUPERADMIN.
- Redefinida a matriz de permissões dos 4 perfis (ver seção "Controle de Acesso"): PROFESSOR perdeu acesso a Relatórios, Mensagens e Unidades/Arenas, e ficou só de consulta em Turmas; RECEPÇÃO perdeu acesso a Planejamento Pedagógico e Financeiro.
- Implementada redação de campos do Aluno para o perfil PROFESSOR diretamente nos Services (não apenas na UI) — ver seção "Redação de Dados por Perfil".
- Implementado isolamento multi-unidade completo (Unidade/Arena) com o mecanismo de header `X-Unidade-Id`, e o vínculo de usuários (Admin, Professor, Recepção) a múltiplas unidades via `UsuarioUnidade`.

---

# Upload de Arquivos

Planejamento futuro.

Permitir apenas:

jpg

png

webp

pdf

Limitar tamanho dos arquivos.

---

# Backup

Periodicidade

Diária

Armazenamento

Local

Nuvem

Retenção

7 dias

30 dias

12 meses

---

# Monitoramento

Monitorar

Tentativas de login

Erros

Consumo de recursos

Tempo de resposta

Disponibilidade

---

# Recuperação

Em caso de incidente

1.

Isolar problema

↓

2.

Restaurar backup

↓

3.

Validar banco

↓

4.

Liberar sistema

---

# Boas Práticas

Nunca utilizar any para dados sensíveis.

Nunca desabilitar autenticação em produção.

Nunca armazenar segredos no código.

Nunca compartilhar banco de produção.

Sempre revisar permissões.

Sempre validar entradas do usuário.

---

# Roadmap

Próximas melhorias

Autenticação em dois fatores (2FA)

Recuperação de senha por e-mail

Bloqueio após tentativas de login

Sessões simultâneas

Auditoria completa

Logs estruturados

Criptografia de arquivos

Integração com serviços de monitoramento

---

# Conclusão

A segurança do Sys Belt deve evoluir continuamente.

Toda nova funcionalidade deverá ser analisada sob a perspectiva de proteção dos dados, controle de acesso e conformidade com as boas práticas de desenvolvimento seguro.
