# Banco de Dados

Versão do documento: 1.0

Última atualização: Julho/2026

---

# Objetivo

O banco de dados do SGCL Kids foi modelado para representar toda a vida acadêmica, esportiva e administrativa do aluno.

O modelo foi desenvolvido utilizando Prisma ORM, permitindo compatibilidade entre SQLite (desenvolvimento) e PostgreSQL (produção).

---

# Tecnologias

ORM

- Prisma ORM

Banco durante desenvolvimento

- SQLite

Banco em produção

- PostgreSQL

---

# Convenções

## Chaves primárias

Todas as tabelas utilizam:

id INTEGER AUTOINCREMENT

ou

id SERIAL (PostgreSQL)

---

## Datas

Campos padrão

createdAt

updatedAt

Sempre armazenados em UTC.

---

## Campos booleanos

Utilizar nomes positivos.

Exemplo

ativo

presente

responsavelFinanceiro

recebeComunicados

Nunca utilizar nomes negativos.

---

# Modelo Conceitual

                    Turma
                       │
             1         │         N
                       │
                    Aluno
                       │
       ┌───────────────┼────────────────┐
       │               │                │
Responsável       AulaAluno      Mensalidade
       │               │                │
       │               │                │
       │            Aula           Competição
       │
Graduação
       │
Currículo
       │
Técnicas

---

# Entidades

## Usuario

Responsável pela autenticação.

Campos

id

nome

email

senha

perfil

ativo

createdAt

---

Relacionamentos

Nenhum obrigatório.

---

Perfis

ADMIN

PROFESSOR

RECEPCAO

---

## Turma

Representa uma turma da academia.

Campos

id

nome

faixaEtaria

diasSemana

horarioInicio

horarioFim

professor

ativo

createdAt

---

Relacionamentos

Uma turma possui muitos alunos.

Uma turma possui muitas aulas.

---

## Aluno

Entidade principal do sistema.

Campos

id

nome

dataNascimento

sexo

cpf

rg

telefone

whatsapp

email

cep

logradouro

numero

complemento

bairro

cidade

uf

escola

serieEscolar

turnoEscolar

peso

altura

tamanhoKimono

marcaKimono

restricoesMedicas

alergias

medicamentos

observacoes

fotoUrl

faixa

grau

ativo

turmaId

createdAt

updatedAt

---

Relacionamentos

Aluno

↓

Turma

↓

Responsáveis

↓

Aulas

↓

Mensalidades

↓

Competições

↓

Graduações

---

## Responsavel

Responsável legal pelo aluno.

Campos

id

nome

cpf

rg

dataNascimento

sexo

telefone

whatsapp

email

cep

logradouro

numero

complemento

bairro

cidade

uf

parentesco

responsavelFinanceiro

podeBuscar

contatoEmergencia

recebeComunicados

fotoUrl

ativo

alunoId

createdAt

updatedAt

---

Relacionamento

N → 1

Aluno

---

## Aula

Representa uma aula realizada.

Campos

id

turmaId

professor

data

observacoes

status

createdAt

---

Status

ABERTA

FINALIZADA

---

Relacionamentos

Uma aula possui vários registros AulaAluno.

---

## AulaAluno

Substituiu completamente o antigo modelo Presenca.

Campos

id

aulaId

alunoId

presente

respeito

valentia

esforco

atencao

disciplina

observacao

createdAt

---

Objetivo

Registrar toda participação do aluno em uma aula.

---

## Graduacao

Histórico oficial de graduações.

Campos

id

alunoId

faixaAnterior

novaFaixa

grauAnterior

novoGrau

observacoes

dataGraduacao

createdAt

---

Objetivo

Nunca perder histórico.

---

## Mensalidade

Controle financeiro.

Campos

id

alunoId

referencia

valor

vencimento

dataPagamento

status

formaPagamento

observacoes

createdAt

---

Status

PENDENTE

PAGA

ATRASADA

CANCELADA

---

## Competicao

Participação do aluno.

Campos

id

alunoId

nome

cidade

estado

categoria

peso

resultado

data

observacoes

createdAt

---

## Tecnica

Cadastro pedagógico.

Campos

id

nome

categoria

descricao

faixaMinima

ativa

createdAt

---

Categorias

Queda

Guarda

Passagem

Raspagem

Finalização

Defesa

Movimentação

---

## Curriculo

Organização pedagógica.

Campos

id

titulo

modulo

idadeMinima

idadeMaxima

ordem

ativo

createdAt

---

Relacionamentos

Currículo

↓

Técnicas

---

# Integridade

Todas as FKs utilizam integridade referencial.

Exemplo

Aluno

↓

Turma

Caso uma turma seja removida:

Não remover automaticamente alunos.

---

# Índices

Recomendados

Aluno

nome

cpf

turmaId

Responsável

cpf

telefone

Aula

turmaId

data

Mensalidade

alunoId

status

vencimento

Competição

alunoId

data

---

# Estratégia de Exclusão

Nunca excluir dados históricos.

Utilizar:

ativo = false

para:

Aluno

Turma

Usuário

Responsável

---

Históricos

Nunca apagar.

Graduação

Competição

Aula

Mensalidade

---

# Evolução

A estrutura foi preparada para futuras implementações.

Área dos Pais

↓

Tabela UsuarioResponsavel

---

Área do Professor

↓

Professor

↓

Turmas

↓

Especialidades

---

SaaS

↓

Academia

↓

Filial

↓

Usuários

↓

Alunos

---

# Boas práticas

Nunca acessar banco sem Service.

Nunca utilizar SQL manual.

Sempre utilizar Prisma.

Sempre criar migração.

Nunca alterar banco diretamente.

---

# Fluxo de Dados

Cadastro

↓

Aluno

↓

Turma

↓

Aula

↓

AulaAluno

↓

Graduação

↓

Prontuário

---

# Roadmap

Próximas entidades

Professor

Agenda

Plano de Aula

Notificação

Pagamento

PIX

Auditoria

Arquivos

Documentos

Área dos Pais

Área do Professor

---

# Conclusão

O modelo de dados do SGCL Kids foi concebido para representar toda a jornada do aluno, desde sua matrícula até sua evolução esportiva, mantendo histórico completo e permitindo futuras expansões para uma plataforma SaaS sem necessidade de remodelagem estrutural.