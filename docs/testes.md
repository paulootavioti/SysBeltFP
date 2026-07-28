# Testes

Versão: 2.0

Última atualização: Julho/2026 (Vitest já em uso, não mais planejado — convenções reais de teste automatizado)

---

# Objetivo

Este documento define a estratégia oficial de testes do Sys Belt - Sistema Faixa Preta.

Seu objetivo é garantir que todas as funcionalidades entregues apresentem qualidade, estabilidade e segurança antes de serem disponibilizadas aos usuários.

---

# Princípios

Toda funcionalidade deverá ser:

- testada
- validada
- homologada
- documentada

Nenhuma funcionalidade deve ser considerada concluída sem passar pelos critérios definidos neste documento.

---

# Pirâmide de Testes

                 E2E
               Integração
             Testes Unitários

---

# Tipos de Teste

O Sys Belt utiliza quatro níveis.

- Testes manuais
- Testes unitários
- Testes de integração
- Testes End-to-End

---

# Testes Manuais

Atualmente representam a principal estratégia de validação do sistema.

Cada Sprint deverá ser validada manualmente antes da entrega.

---

# Testes Unitários

Objetivo

Validar regras de negócio isoladamente.

Exemplos

CreateAlunoService

UpdateAlunoService

LoginService

StartAulaService

FinalizarAulaService

AtualizarEvolucaoAlunoService

---

# Testes de Integração

Objetivo

Validar comunicação entre:

Controller

↓

Service

↓

Prisma

↓

Banco

---

Exemplo

POST /alunos

↓

Banco

↓

Resposta

201

---

# Testes End-to-End

Objetivo

Simular o comportamento do usuário.

Fluxo

Login

↓

Dashboard

↓

Cadastrar aluno

↓

Cadastrar responsável

↓

Criar aula

↓

Registrar presença

↓

Finalizar aula

↓

Consultar prontuário

---

# Ferramentas

Em uso hoje

- **Vitest** — testes unitários e de integração, backend e frontend.
- **Playwright** — verificação manual de UI (login como cada perfil, fluxos completos num navegador real) antes de cada entrega. Não faz parte de uma suíte automatizada/CI ainda.

Não utilizadas

- Supertest (os testes de backend chamam os Services diretamente, não fazem requisição HTTP)

---

# Ambientes

Desenvolvimento, testes e produção utilizam **PostgreSQL** — não há SQLite em nenhum ambiente.

Os testes de integração do backend rodam contra um Postgres real (local, na máquina de desenvolvimento), não contra um banco mockado ou em memória.

---

# Testes Automatizados — Convenções Reais

## Comandos

```bash
npm run test              # backend: roda toda a suíte (vitest run)
npm run test:unit         # backend: só src/shared (funções puras, sem banco)
npm run test:integration  # backend: só src/modules (Services, contra Postgres real)

cd sgcl-web && npm run test   # frontend: vitest run
```

## Backend — testes de integração contra Postgres real

A maioria dos testes de backend (`src/modules/**/*.test.ts`) não mocka o Prisma — chama o Service de verdade contra o banco de desenvolvimento. Padrão usado em todo arquivo de teste:

```ts
async function limpar() {
  await prisma.aluno.deleteMany({ where: { nome: { startsWith: "TESTE_CONTEXTO_" } } });
  await prisma.unidade.deleteMany({ where: { nome: "TESTE_CONTEXTO_UNIDADE" } });
}

beforeEach(async () => {
  await limpar();
  // cria as fixtures (unidade, turma, usuário...) que o teste precisa
});
afterAll(limpar);
```

- Todo dado de fixture usa um prefixo `TESTE_<CONTEXTO>_` no nome — nunca cria dados "soltos" sem esse prefixo, para nunca colidir com dados reais nem deixar lixo entre execuções.
- `vitest.config.ts` roda os arquivos de teste **sequencialmente** (`fileParallelism: false`) — testes em paralelo, contra o mesmo banco, causam corridas reais (ex.: um arquivo apaga uma Turma no instante em que outro ainda depende dela por FK). Isso já causou falhas intermitentes reais neste projeto.
- Testes de funções puras (sem banco), como cálculo de faixa/data, ficam em `src/shared/**/*.test.ts` e não precisam de `beforeEach`/`afterAll`.

## Frontend — testes unitários

Cobrem principalmente lógica pura sem I/O: formatadores (`data.test.ts`, `masks.test.ts`), mapeamento de erro de API, e a matriz de acesso por perfil (`acessoPorPerfil.test.ts`) — que garante que o menu/rotas do frontend nunca ofereçam algo que a API recusaria.

## Verificação manual com Playwright

Antes de qualquer entrega que mexa em permissões ou fluxo de UI, o padrão adotado é abrir os servidores locais (backend + frontend) e usar Playwright para logar como cada perfil afetado, navegar pelas telas relevantes e confirmar visualmente (inclusive com screenshot) que o comportamento é o esperado — além dos testes automatizados, não no lugar deles.

## Gate de verificação antes de qualquer entrega

Backend:

```bash
npx tsc --noEmit -p .
npx vitest run
```

Frontend:

```bash
npx tsc --noEmit -p .
npx eslint src --ext .ts,.tsx
npx vitest run
npm run build
```

Nenhuma mudança é considerada pronta com qualquer um desses passos falhando.

---

# Critérios Gerais

Toda funcionalidade deverá possuir:

Resposta correta

Sem erros de console

Sem erros de TypeScript

Sem erros de ESLint

---

# Critérios por Módulo

## Login

Testar

Login válido

Senha inválida

Usuário inexistente

Usuário inativo

JWT

Logout

---

## Dashboard

Validar

Cards

Indicadores

Carregamento

Permissões

---

## Alunos

Cadastrar

Editar

Inativar

Buscar

Prontuário

Aniversariantes

Troca de turma

---

## Responsáveis

Cadastrar

Editar

Responsável financeiro

Contato emergência

Pode buscar

Recebe comunicados

---

## Turmas

Cadastrar

Editar

Inativar

Listar

Professor

Horários

---

## Aulas

Criar

Selecionar turma

Criar AulaAluno

Registrar presença

Registrar comportamento

Finalizar

Bloquear alterações

---

## Evolução

Contabilizar presença

Atualizar grau

Trocar faixa

Registrar histórico

---

## Graduações

Cadastrar

Editar

Listar

Histórico

Consultar evolução

---

## Mensalidades

Gerar

Editar

Pagar

Cancelar

Atrasar

Consultar histórico

---

## Competições

Cadastrar

Editar

Excluir

Consultar histórico

---

## Currículo

Cadastrar técnica

Editar técnica

Inativar

Consultar

---

## Usuários

Cadastrar

Editar

Inativar

Trocar perfil

Login

---

# Testes de Interface

Verificar

Layout

Responsividade

Mensagens

Loading

EmptyState

Modal

Confirmações

---

# Testes de Permissão

Matriz completa em `seguranca.md` e `regras-de-negocio.md` (RN-170 a RN-174). Resumo:

SUPERADMIN

↓

Irrestrito — todas as unidades e telas

---

ADMIN

↓

Própria(s) unidade(s) — todas as telas

---

PROFESSOR

↓

Pedagógico, aulas, graduações, competições — dados de Aluno redigidos, sem Relatórios/Mensagens/Unidades

---

RECEPCAO

↓

Cadastros, mensalidades, mensagens, relatórios — sem Planejamento Pedagógico nem Financeiro

---

# Testes de Segurança

JWT inválido

JWT expirado

Sem token

Permissão insuficiente

Rotas protegidas

---

# Testes de Performance

Carregamento Dashboard

Listagem de alunos

Prontuário

Aulas

Mensalidades

---

# Testes de Banco

Criar

Editar

Excluir lógico

Relacionamentos

Integridade

---

# Checklist de Homologação

## Login

☐ Entrar

☐ Sair

☐ Token salvo

☐ Token removido

---

## Dashboard

☐ Abre

☐ Indicadores corretos

---

## Alunos

☐ Cadastro

☐ Edição

☐ Consulta

☐ Prontuário

☐ Inativação

---

## Responsáveis

☐ Cadastro

☐ Consulta

☐ Alteração

---

## Turmas

☐ Cadastro

☐ Consulta

☐ Alteração

---

## Aulas

☐ Criar

☐ Registrar presença

☐ Registrar comportamento

☐ Finalizar

---

## Evolução

☐ Grau atualizado

☐ Faixa atualizada

☐ Histórico criado

---

## Mensalidades

☐ Gerar

☐ Baixa

☐ Consulta

---

## Competições

☐ Cadastro

☐ Consulta

---

# Critérios de Aceite

Uma funcionalidade somente poderá ser considerada concluída quando:

✔ Compilar sem erros

✔ ESLint sem erros

✔ TypeScript sem erros

✔ Banco atualizado

✔ Testes executados

✔ Homologação concluída

✔ Documentação atualizada

---

# Regressão

Antes de cada versão deverá ser executado um teste completo dos seguintes módulos:

Login

Dashboard

Alunos

Responsáveis

Turmas

Aulas

Graduações

Mensalidades

Competições

Relatórios

---

# Roadmap

Já implementado (deixou de ser roadmap)

- Testes unitários e de integração automatizados (Vitest, backend e frontend)
- Verificação manual de UI com Playwright antes de entregas sensíveis

Próximas melhorias

- Integração contínua (rodar a suíte automaticamente a cada push/PR)
- Automatizar parte da verificação com Playwright hoje manual (fluxos críticos de permissão)
- Banco de testes isolado/temporário (hoje os testes de integração usam o próprio banco de desenvolvimento)
- Testes de carga
- Métricas de cobertura de código

---

# Indicadores de Qualidade

Ainda não há medição formal de cobertura (% de linhas/branches). O critério prático adotado hoje é:

- Todo Service com regra de negócio não trivial (conflito de horário, redação de campos, transferência de aula, multi-unidade) tem teste de integração cobrindo o caminho feliz e as rejeições principais.
- Toda mudança de permissão (RBAC) tem teste cobrindo quem pode e quem não pode.

Métricas de cobertura (%) ficam como melhoria futura — ver "Roadmap" acima.

---

# Conclusão

Os testes garantem que o Sys Belt evolua com segurança e previsibilidade.

Toda nova funcionalidade deverá passar pelos critérios definidos neste documento antes de ser considerada pronta para uso.