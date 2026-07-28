# Sys Belt - Sistema Faixa Preta — Roadmap Oficial

> Documento de Planejamento Estratégico

Versão do documento: 3.0

Última atualização: Julho/2026 (multi-tenant e RBAC concluídos — deixaram de ser visão de longo prazo)

---

# Visão

O Sys Belt - Sistema Faixa Preta é um sistema completo de gestão para academias de Jiu-Jitsu Infantil.

O projeto foi concebido para unir:

- Gestão administrativa
- Gestão pedagógica
- Gestão esportiva
- Gestão financeira

em uma única plataforma.

O objetivo é transformar o acompanhamento dos alunos em um processo totalmente integrado, permitindo que professores, secretaria e coordenação trabalhem sobre a mesma base de informações.

---

# Missão

Fornecer uma plataforma moderna para academias de artes marciais que permita acompanhar toda a jornada do aluno, desde sua matrícula até sua formação esportiva.

---

# Valores

- Simplicidade
- Segurança
- Organização
- Pedagogia
- Evolução contínua
- Dados confiáveis
- Experiência do professor

---

# Estado Atual

Versão

1.3.0-alpha

Situação

🟢 Desenvolvimento Ativo — multi-unidade (multi-tenant) e RBAC completo já em produção

---

# Tecnologias

Backend

- Node.js
- Express
- Prisma
- PostgreSQL

Frontend

- React
- TypeScript
- React Router

Autenticação

- JWT

Deploy

- Netlify (frontend estático + backend como Netlify Function)

---

# Módulos

## Infraestrutura

Status

✅ Concluído

Itens

- API REST
- Prisma
- JWT
- Middleware
- Controle de perfis (4 perfis: SUPERADMIN, ADMIN, PROFESSOR, RECEPCAO)

---

## Multi-Tenant (Unidades e Arenas)

Status

✅ Concluído

Itens

- Unidade (filial) e Arena (sala/tatame), com isolamento de dados por unidade em todos os módulos
- SUPERADMIN: acesso irrestrito, com seletor "visualizar como" qualquer unidade ou todas
- Checagem de conflito de horário por Arena/professor
- Usuário (Admin, Professor, Recepção) vinculado a mais de uma unidade, com seletor de "unidade ativa"

---

## Permissões por Perfil (RBAC)

Status

✅ Concluído

Itens

- Matriz de permissões granular por módulo e perfil (ver `regras-de-negocio.md` e `seguranca.md`)
- Redação de campos do Aluno para o perfil Professor
- Consulta somente leitura de grade horária entre unidades para Admin/Professor
- Transferência de aula entre professores, com justificativa obrigatória

---

## Dashboard

Status

✅ Concluído

Implementado

- Dashboard inicial
- Indicadores
- KPIs
- Próximas graduações
- Alertas de mensalidades vencidas

---

## Autenticação

Status

✅ Concluído

- Login
- JWT
- Controle de acesso

---

## Usuários

Status

✅ Concluído

- Cadastro
- Perfis
- Ativação

---

## Alunos

Status

🟢 Estrutura concluída

Implementado

- Cadastro completo
- Escola
- Saúde
- Kimono
- Turma
- Foto (estrutura)

Pendências

- Upload real de imagem

---

## Responsáveis

Status

✅ Concluído

- Cadastro
- Financeiro
- Emergência

---

### Turmas

Status

✅ Concluído

- Cadastro
- Professor
- Horários
- Vínculo de alunos
- Ativação/inativação

---

## Matrículas

Status

🟡 Planejado

Objetivos

- Matrícula anual
- Histórico
- Transferências

---

## Aulas

Status

✅ Concluído

- Abrir aula
- Chamada
- Encerrar aula
- Vínculo com plano de aula do currículo
- Programação prévia de aulas

---

## Comportamentos

Status

✅ Concluído

- Respeito
- Valentia
- Esforço
- Atenção
- Disciplina

---

## Currículo

Status

🟢 Concluído

- Cadastro
- Organização por módulos

---

## Técnicas

Status

🟢 Concluído

- Cadastro
- Categorias
- Faixas

---

## Prontuário

Status

🟢 Estrutura concluída

Implementado

- Backend
- Endpoint
- Frontend

Pendências

- Timeline
- Gráficos

---

## Graduação

Status

🟢 Estrutura concluída

Implementado

- Evolução
- Grau
- Trilha Infantil (até Verde) e trilha Juvenil/Adulta (Branca a Preta), com validação de idade mínima e tempo de permanência

Pendências

- Troca automática
- Certificados

---

## Financeiro

Status

🟡 Em evolução

Implementado

- Estrutura
- Mensalidades
- Recebimentos
- Caixa
- Inadimplência

Pendências

- PIX

---

## Competições

Status

🟢 Concluído

Implementado

- Cadastro
- Inscrição de atletas
- Registro de resultado

Pendências

- Ranking
- Medalhas
- Estatísticas

---

## Relatórios

Status

🟢 Concluído

Implementado

- Financeiro
- Ranking de frequência
- Aniversariantes
- Evolução do aluno
- Comportamental

Pendências

- PDF
- Excel
- Envio automático por WhatsApp

---

# Roadmap

## Sprint 01

✅ Fundação

---

## Sprint 02

✅ Autenticação

---

## Sprint 03

✅ Design System Inicial

---

## Sprint 04

✅ Cadastro Completo de Alunos

---

## Sprint 05

✅ Responsáveis

---

## Sprint 06

✅ Turmas

---

## Sprint 07

✅ Aulas

---

## Sprint 08

✅ Comportamentos

---

## Sprint 09

✅ Técnicas

---

## Sprint 10

✅ Currículo

---

## Sprint 11

✅ Prontuário

---

## Sprint 12

🟡 Graduação Inteligente

---

## Sprint 13

🟡 Financeiro

---

## Sprint 14

✅ Dashboard Executivo

---

## Sprint 15

🟡 Planejamento Pedagógico

---

## Sprint 16

✅ Competições

---

## Sprint 17

✅ Relatórios

---

## Sprint 18

✅ Multi-Tenant (Unidades e Arenas)

---

## Sprint 19

✅ Permissões por Perfil (RBAC) e Transferência de Aula

---

## Sprint 20

✅ Usuário Multi-Unidade

---

## Sprint 21

✅ Documentação núcleo e complementar atualizada

---

# Objetivo da versão 1.0

A versão 1.0 deverá permitir o funcionamento completo da academia sem necessidade de controles paralelos em planilhas.

Ela contemplará:

- Cadastro completo
- Prontuário
- Planejamento pedagógico
- Financeiro
- Competições
- Dashboard
- Relatórios

---

# Versão 2.0

Planejada para:

- Aplicativo Mobile
- Área dos Pais
- Área do Professor
- Área do Aluno
- WhatsApp
- IA para planejamento de aulas
- IA para evolução técnica

---

# Longo Prazo

O núcleo multi-tenant (Unidade → Arena → Turma, isolamento de dados, SUPERADMIN, usuários vinculados a múltiplas unidades) já está implementado — a plataforma já funciona como um SaaS para múltiplas unidades de uma mesma academia.

O que falta para uma oferta SaaS multi-cliente (várias academias diferentes, não só várias unidades da mesma):

- Onboarding self-service de uma nova academia (hoje o cadastro de Unidade é feito manualmente por um SUPERADMIN)
- Cobrança/plano de assinatura da própria plataforma (separado do módulo de Mensalidades, que é da academia para o aluno)
- Página pública de marketing/cadastro

---

# Critérios de Conclusão da Versão 1.0

✔ Todos os módulos implementados

✔ Testes concluídos

✔ Documentação completa

✔ Backup

✔ Segurança

✔ Deploy em produção

✔ Primeira academia utilizando oficialmente o sistema