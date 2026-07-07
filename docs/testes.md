# Testes

Versão: 1.0

Última atualização: Julho/2026

---

# Objetivo

Este documento define a estratégia oficial de testes do SGCL Kids.

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

O SGCL utiliza quatro níveis.

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

Planejamento

Vitest

Supertest

Playwright

---

# Ambientes

Desenvolvimento

SQLite

---

Homologação

PostgreSQL

---

Produção

Validação final

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

ADMIN

↓

Todas rotas

---

PROFESSOR

↓

Módulos pedagógicos

---

RECEPCAO

↓

Cadastros

↓

Financeiro

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

Próximas melhorias

Cobertura automática

Testes unitários

Integração contínua

Playwright

Cypress

Mock Server

Banco temporário

Testes de carga

Testes automatizados de regressão

---

# Indicadores de Qualidade

Objetivos da versão 1.0

Cobertura de testes unitários

80%

Cobertura de integração

70%

Cobertura E2E

Fluxos críticos

100%

---

# Conclusão

Os testes garantem que o SGCL evolua com segurança e previsibilidade.

Toda nova funcionalidade deverá passar pelos critérios definidos neste documento antes de ser considerada pronta para uso.