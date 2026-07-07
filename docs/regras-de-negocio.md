# Regras de Negócio

Versão do documento: 1.0

Última atualização: Julho/2026

---

# Objetivo

Este documento descreve todas as regras de negócio do SGCL Kids.

Toda implementação realizada no sistema deve obedecer às regras aqui descritas.

Caso uma regra seja alterada, este documento deverá ser atualizado antes da implementação.

---

# Filosofia do Sistema

O SGCL não é apenas um sistema administrativo.

Ele foi desenvolvido para acompanhar toda a jornada do aluno dentro da academia.

O sistema considera quatro pilares.

- Formação humana
- Formação técnica
- Formação esportiva
- Formação administrativa

Todos os módulos existem para atender um ou mais desses pilares.

---

# Cadastro de Alunos

## RN-001

Todo aluno deve possuir:

- Nome
- Data de nascimento

---

## RN-002

Não pode existir outro aluno com:

Nome

+

Data de nascimento

iguais.

---

## RN-003

O aluno pode permanecer inativo.

Nenhum histórico será apagado.

---

## RN-004

Toda alteração cadastral deve atualizar o campo:

updatedAt

---

# Responsáveis

## RN-010

Um aluno pode possuir vários responsáveis.

---

## RN-011

Um responsável pertence a apenas um aluno.

(Esta regra poderá ser alterada futuramente.)

---

## RN-012

Somente um responsável pode ser marcado como:

Responsável Financeiro.

---

## RN-013

Mais de um responsável pode buscar o aluno.

---

## RN-014

Mais de um responsável pode receber comunicados.

---

# Turmas

## RN-020

Todo aluno pertence a apenas uma turma ativa.

---

## RN-021

Uma turma pode possuir vários alunos.

---

## RN-022

Uma turma pode ser inativada.

Se isso ocorrer:

Os alunos permanecem cadastrados.

---

# Aulas

## RN-030

Uma aula pertence a apenas uma turma.

---

## RN-031

Uma aula inicia com status:

ABERTA

---

## RN-032

Uma aula pode ser finalizada apenas uma vez.

---

## RN-033

Após finalizada:

não poderá sofrer alterações.

---

## RN-034

Ao criar uma aula:

deve ser criado automaticamente um registro AulaAluno para cada aluno ativo da turma.

---

# Presença

## RN-040

A presença deixou de existir como entidade própria.

Ela agora faz parte de:

AulaAluno.

---

## RN-041

Cada AulaAluno registra:

- presença
- comportamento
- observações

---

## RN-042

Um aluno possui apenas um registro AulaAluno por aula.

---

# Evolução

## RN-050

Cada presença válida contabiliza uma aula.

---

## RN-051

Somente alunos presentes evoluem.

---

## RN-052

Aulas canceladas não contabilizam evolução.

---

# Graus

## RN-060

Da faixa Branca até Verde.

Cada:

8 aulas

↓

1 grau

---

## RN-061

Após completar

4 graus

↓

troca de faixa.

---

## RN-062

Ao trocar de faixa:

grau volta para zero.

---

## RN-063

Todo histórico permanece registrado.

---

# Faixas

A sequência oficial utilizada pelo sistema é:

Branca

Cinza e Branca

Cinza

Cinza e Preta

Amarela e Branca

Amarela

Amarela e Preta

Laranja e Branca

Laranja

Laranja e Preta

Verde

Azul

Roxa

Marrom

Preta

---

# Comportamentos

O sistema utiliza cinco indicadores.

---

## Respeito

Cor

Azul

---

## Valentia

Cor

Verde

---

## Esforço

Cor

Laranja

---

## Atenção

Cor

Amarelo

---

## Disciplina

Cor

Vermelho

---

# Avaliação comportamental

## RN-070

Cada comportamento pode assumir:

Sim

Não

durante a aula.

---

## RN-071

A soma das aulas gera o indicador do prontuário.

---

## RN-072

Os indicadores nunca são apagados.

---

# Currículo

## RN-080

Toda técnica pertence a uma categoria.

---

Categorias

Quedas

Raspagens

Passagens

Finalizações

Defesas

Movimentação

---

## RN-081

Cada técnica possui:

Faixa mínima.

---

## RN-082

Técnicas inativas não aparecem para o professor.

---

# Planejamento

## RN-090

O planejamento da aula utilizará:

Currículo

↓

Técnicas

↓

Jogos

↓

Objetivos

---

# Prontuário

## RN-100

O prontuário é o principal documento do aluno.

---

Ele reúne:

Dados pessoais

↓

Responsáveis

↓

Turma

↓

Frequência

↓

Comportamentos

↓

Graduações

↓

Competições

↓

Financeiro

↓

Resumo

---

## RN-101

Nenhum dado histórico poderá ser removido do prontuário.

---

# Financeiro

## RN-110

Cada mensalidade pertence a apenas um aluno.

---

## RN-111

Uma mensalidade pode possuir:

Pendente

Paga

Cancelada

Atrasada

---

## RN-112

O histórico financeiro nunca deve ser apagado.

---

# Competições

## RN-120

Cada competição pertence a um aluno.

---

## RN-121

Uma competição registra:

Evento

Categoria

Peso

Resultado

Data

Observações

---

# Segurança

## RN-130

Todas as rotas exigem autenticação.

Exceto:

Login.

---

## RN-131

Toda rota possui controle de perfil.

---

Perfis

ADMIN

PROFESSOR

RECEPCAO

---

# Exclusão

## RN-140

Nenhuma entidade histórica poderá ser apagada.

Exemplos

Aulas

Competições

Mensalidades

Graduações

---

## RN-141

Cadastros deverão utilizar:

ativo = false

---

# Auditoria

## RN-150

Toda alteração importante deverá possuir:

Data

Usuário

Ação

(Estrutura prevista para versões futuras.)

---

# Integrações Futuras

WhatsApp

PIX

Área dos Pais

Área do Professor

Aplicativo Mobile

Inteligência Artificial

---ß

# Princípios

O SGCL foi desenvolvido considerando que o objetivo principal da academia não é apenas ensinar técnicas de Jiu-Jitsu, mas formar pessoas.

Por isso, todas as regras do sistema procuram refletir tanto a evolução técnica quanto o desenvolvimento humano do aluno.

Toda nova funcionalidade deverá respeitar esses princípios.