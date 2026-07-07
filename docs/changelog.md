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

# 0.9.0-alpha

## Segurança

### Corrigido

- Rota `POST /auth/register` deixou de ser pública; agora exige um ADMIN autenticado
- `GET /financeiro/resumo` liberado também para RECEPÇÃO (estava restrito só a ADMIN, contrariando as regras de negócio documentadas)

---

## Prontuário

### Corrigido

- Tela de prontuário (já existente) agora está acessível a partir dos detalhes do aluno

---

## Usuários

### Adicionado

- Tela de administração de usuários: cadastro, troca de perfil, ativação/inativação

---

## Competições

### Adicionado

- Cadastro de competições
- Inscrição de atletas
- Registro de resultado por atleta

---

## Relatórios

### Adicionado

- Geração de relatórios em texto: financeiro, ranking de frequência, aniversariantes do mês, evolução do aluno, comportamental
- Opção de copiar o texto gerado

---

## Dashboard

### Adicionado

- Alerta de mensalidades vencidas
- Widget de próximas graduações
- Reorganização em seções (Alunos e Atividades, Financeiro)

---

## Financeiro

### Adicionado

- Tela de caixa e inadimplência, com baixa de mensalidades vencidas direto na tela

---

## Planejamento Pedagógico

### Adicionado

- Cadastro de módulos, aulas planejadas (com objetivo e jogos sugeridos) e técnicas sugeridas dentro do currículo

---

## Graduação

### Adicionado

- Trilha de faixas Juvenil/Adulta (Branca, Azul, Roxa, Marrom, Preta), com validação de idade mínima e tempo de permanência na faixa atual antes de permitir a troca
- Formulário de graduação agora filtra as faixas disponíveis conforme a idade do aluno (trilha Infantil até Verde, trilha Juvenil/Adulta a partir de 15 anos)

---

## Correções gerais

### Corrigido

- Bug crítico de import que impedia o carregamento de toda a aplicação
- Relatório Comportamental lia de uma tabela que nunca era populada; agora usa os mesmos registros de presença/comportamento por aula que o Prontuário já usava

### Melhorado

- Consolidação de tipos e utilitários duplicados entre módulos (`Mensalidade`, `Responsavel`, `getApiErrorMessage`, `ApiClient`)
- Padronização visual das telas de Mensalidades e Graduações (não usavam CSS real)

---

# Próximas versões

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

---

## 0.9.0-alpha
Fechamento de módulos pendentes e correções críticas.

- Segurança: rota de cadastro de usuário deixou de ser pública
- Prontuário: tela linkada na navegação (já existia, estava órfã)
- Usuários: tela completa de administração (cadastro, perfil, ativação)
- Competições: cadastro, inscrição de atletas e registro de resultado
- Relatórios: geração de texto (financeiro, ranking, aniversariantes, evolução, comportamental)
- Dashboard: reorganizado em seções, alertas de mensalidades vencidas, próximas graduações
- Financeiro: tela de caixa e inadimplência
- Planejamento Pedagógico: cadastro de módulos, aulas planejadas, técnicas sugeridas e jogos
- Correção de bug crítico que impedia o carregamento da aplicação
- Consolidação de código e tipos duplicados entre módulos
- Padronização visual das telas de Mensalidades e Graduações