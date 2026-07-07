# Changelog

Todas as mudanças relevantes do SGCL Kids serão documentadas neste arquivo.

O formato utilizado segue o conceito do **Keep a Changelog**, adaptado para o projeto.

---

# Convenções

Cada versão será dividida em:

## Adicionado

Novas funcionalidades.

## Alterado

Mudanças de comportamento.

## Melhorado

Refatorações e melhorias.

## Corrigido

Correções de bugs.

## Removido

Funcionalidades descontinuadas.

---

# 0.1.0-alpha

## Fundação do Projeto

### Adicionado

- Estrutura inicial do backend
- Express
- Prisma ORM
- SQLite
- Organização em módulos
- API REST

---

# 0.2.0-alpha

## Autenticação

### Adicionado

- Login
- JWT
- Middleware de autenticação
- Controle de perfis

### Melhorado

- Estrutura de usuários

---

# 0.3.0-alpha

## Cadastro de Alunos

### Adicionado

- Cadastro de alunos
- Consulta
- Atualização
- Ativação/Inativação

### Melhorado

- Organização do módulo de alunos

---

# 0.4.0-alpha

## Cadastro Completo

### Adicionado

Cadastro completo contendo:

- Dados pessoais
- Contato
- Endereço
- Escola
- Saúde
- Kimono
- Foto (estrutura)
- Observações

### Melhorado

- Organização do formulário

---

# 0.5.0-alpha

## Responsáveis

### Adicionado

Cadastro de responsáveis

- Financeiro
- Emergência
- Buscar aluno
- Receber comunicados

---

## Turmas

### Adicionado

- Cadastro de turmas
- Professor
- Horários
- Faixa etária

---

# 0.6.0-alpha

## Aulas

### Adicionado

Novo modelo pedagógico baseado em aulas.

### Criado

- Aula
- AulaAluno

### Removido

Modelo antigo de Presença.

### Melhorado

Fluxo de chamada.

---

## Comportamentos

### Adicionado

Sistema comportamental.

- Respeito
- Valentia
- Esforço
- Atenção
- Disciplina

---

# 0.7.0-alpha

## Currículo

### Adicionado

- Técnicas
- Currículo pedagógico
- Organização por módulos

---

## Prontuário

### Adicionado

Novo endpoint:

GET /alunos/:id/prontuario

Retornando:

- Aluno
- Turma
- Responsáveis
- Frequência
- Evolução
- Comportamentos
- Histórico
- Financeiro
- Competições

---

## Dashboard

### Melhorado

Nova organização dos indicadores.

---

## Design System

### Adicionado

Novos componentes.

- Page
- Section
- InfoCard
- StatusBadge

---

# 0.8.0-alpha

## Graduação

### Adicionado

Início da graduação inteligente.

- Evolução por presenças
- Próximo grau
- Histórico de graduação

---

## Financeiro

### Adicionado

Início do módulo de mensalidades.

- Cadastro
- Estrutura de cobrança
- Situação financeira do aluno

---

# Próximas versões

## 0.9.0-alpha

Planejamento pedagógico.

- Plano da aula
- Objetivos
- Técnicas sugeridas
- Jogos

---

## 1.0.0

Primeira versão oficial.

- Sistema completo
- Produção
- Documentação finalizada
- Testes homologados

---

# Histórico de decisões importantes

## Presença → AulaAluno

O sistema deixou de registrar apenas presença.

Passou a registrar:

- presença
- comportamento
- observações
- evolução

Essa decisão tornou possível construir o prontuário completo do aluno.

---

## Currículo Pedagógico

Foi criado um módulo específico para organizar:

- técnicas
- módulos
- progressão

separando conteúdo pedagógico da execução da aula.

---

## Prontuário

O prontuário tornou-se o principal agregador de informações do sistema.

Ele passou a centralizar:

- evolução
- responsáveis
- histórico
- frequência
- financeiro
- competições