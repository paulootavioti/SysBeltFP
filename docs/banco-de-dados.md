# Banco de Dados

Versão do documento: 2.0

Última atualização: Julho/2026 (multi-tenant: Unidade/Arena, UsuarioUnidade, Plano, AvisoReconhecido, campos de transferência de aula)

---

# Objetivo

O banco de dados do Sys Belt - Sistema Faixa Preta foi modelado para representar toda a vida acadêmica, esportiva e administrativa do aluno, em um sistema **multi-tenant**: uma instalação atende várias Unidades (filiais), cada uma com seus dados isolados.

O modelo foi desenvolvido utilizando Prisma ORM sobre **PostgreSQL** (único banco utilizado — não há mais SQLite em nenhum ambiente).

---

# Tecnologias

ORM

- Prisma ORM

Banco

- PostgreSQL (desenvolvimento e produção)

---

# Convenções

## Chaves primárias

Todas as tabelas utilizam `id SERIAL` (autoincrement).

## Datas

Campos padrão `createdAt` / `updatedAt`, sempre armazenados em UTC.

## Campos booleanos

Utilizar nomes positivos: `ativo`, `presente`, `responsavelFinanceiro`, `recebeComunicados`, `pago`. Nunca nomes negativos.

## Multi-tenant (`unidadeId`)

Toda entidade operacional carrega um campo `unidadeId` (FK para `Unidade`). O escopo por unidade é aplicado de forma centralizada nos Services através dos utilitários `escopoUnidade()` e `garantirAcessoUnidade()` (`shared/utils/escopoUnidade.ts`) — nunca filtrando manualmente em cada query.

`unidadeId` nulo é exclusivo do usuário SUPERADMIN (e, por extensão, de `escopoUnidade(null)`, que remove o filtro — usado quando o SUPERADMIN está "vendo todas as unidades").

---

# Modelo Conceitual

```
Unidade
   │
   ├── Arena
   │      │
   │      └── Turma (arenaId opcional)
   │
   ├── Usuario ── UsuarioUnidade ── Unidade (N:N)
   │
   └── Turma
          │
          ├── Aluno (N)
          │      │
          │      ├── Responsavel (N)
          │      ├── AulaAluno (N) ── Aula
          │      ├── Mensalidade (N)
          │      ├── Graduacao (N)
          │      ├── Comportamento (N)
          │      └── CompeticaoAluno (N) ── Competicao
          │
          └── AulaProgramada (N)
                 │
                 └── professorSubstituto (Usuario, opcional)
```

---

# Entidades

## Unidade

Representa uma filial/academia. Raiz do isolamento multi-tenant.

Campos

- id
- nome
- ativo
- createdAt

Relacionamentos

Uma Unidade possui muitas Arenas, Usuários, Alunos, Responsáveis, Turmas, Planos, Currículos, Técnicas, Competições, Mensalidades, Graduações, Aulas e AulasProgramadas — praticamente todas as entidades operacionais do sistema.

---

## Arena

Qualquer sala, tatame ou área física usada para ministrar aulas. Uma Unidade tem uma ou mais Arenas.

Campos

- id
- unidadeId
- nome
- ativo
- createdAt

Relacionamentos

Uma Arena pode estar vinculada a várias Turmas (`Turma.arenaId`, opcional).

---

## Usuario

Responsável pela autenticação e controle de acesso.

Campos

- id
- unidadeId (nulo só para SUPERADMIN; para os demais perfis, é a **unidade ativa** no momento)
- nome
- apelido
- email (único)
- senha (hash bcrypt)
- perfil
- nivelGraduacao
- outrasGraduacoes
- fotoUrl
- ativo
- createdAt

Relacionamentos

- `turmas` — turmas em que o usuário é o professor titular (`Turma.professorId`).
- `unidadesVinculadas` (`UsuarioUnidade[]`) — todas as unidades que o usuário pode acessar. Admin, Professor e Recepção podem ter mais de uma; só o SUPERADMIN monta essa lista.
- `aulasSubstituindo` (`AulaProgramada[]`) — aulas programadas em que esse usuário é o professor substituto (transferência de aula).
- `avisosReconhecidos` — avisos/notificações já reconhecidos pelo usuário.

Perfis

- SUPERADMIN
- ADMIN
- PROFESSOR
- RECEPCAO

---

## UsuarioUnidade

Tabela de junção N:N entre `Usuario` e `Unidade` — permite que Admin, Professor e Recepção estejam vinculados a mais de uma unidade. `Usuario.unidadeId` continua sendo a unidade **ativa** (usada em todo o escopo do sistema); esta tabela só guarda quais unidades cada usuário pode escolher como ativa.

Campos

- id
- usuarioId
- unidadeId
- createdAt

Restrição: par (`usuarioId`, `unidadeId`) único.

---

## Turma

Representa uma turma da academia.

Campos

- id
- unidadeId
- arenaId (opcional)
- nome
- faixaEtaria
- diasSemana (array de inteiros, 0=domingo a 6=sábado)
- horarioInicio / horarioFim
- professorId (opcional, FK para Usuario)
- limiteAlunos (opcional)
- ativo
- curriculoId (opcional)
- createdAt

Relacionamentos

Uma turma possui muitos alunos, muitas aulas realizadas e muitas aulas programadas.

Checagem de conflito de horário: ao criar/editar uma turma ou programar uma aula, o sistema rejeita sobreposição de horário na mesma Arena ou com o mesmo professor (dentro da mesma unidade).

---

## Aluno

Entidade principal do sistema.

Campos

- id
- unidadeId
- nome
- apelido
- dataNascimento
- sexo, cpf, rg
- telefone, whatsapp, email
- cep, logradouro, numero, complemento, bairro, cidade, uf
- escola, serieEscolar, turnoEscolar
- peso, altura
- tamanhoKimono, marcaKimono
- restricoesMedicas, alergias, medicamentos, observacoes
- fotoUrl
- faixa (default "Branca"), grau (default 0)
- ativo
- turmaId (opcional)
- formaPagamento, diaVencimento (opcionais)
- planoId (opcional, FK para Plano)
- createdAt / updatedAt

Relacionamentos

Aluno → Turma, Responsáveis, AulaAluno (histórico de presença/comportamento), Mensalidades, Graduações, Comportamentos, CompeticaoAluno, Plano.

Redação de dados por perfil: o backend nunca envia ao perfil PROFESSOR os campos sensíveis (cpf, endereço, saúde, financeiro etc.) — o `select` do Prisma já é montado sem esses campos quando quem pede é um Professor, e não apenas escondido na UI.

---

## Responsavel

Responsável legal pelo aluno.

Campos

- id, unidadeId
- nome, apelido
- cpf, rg, dataNascimento, sexo
- telefone, whatsapp, email
- cep, logradouro, numero, complemento, bairro, cidade, uf
- parentesco (default "Não informado")
- responsavelFinanceiro, podeBuscar, contatoEmergencia, recebeComunicados
- observacoes, fotoUrl
- ativo
- alunoId
- createdAt / updatedAt

Relacionamento: N → 1 com Aluno.

---

## Aula

Representa uma aula realizada (chamada em andamento ou finalizada).

Campos

- id, unidadeId
- data
- professor (texto livre, override pontual do nome exibido — não é FK)
- observacoes
- turmaId (opcional)
- aulaCurriculoId (opcional — plano de aula seguido)
- jogosRealizados (array de texto)
- tecnicasRealizadas (relação N:N com TecnicaCurriculo)
- status (`ABERTA` | `FINALIZADA`)
- createdAt / updatedAt

Relacionamentos

- Uma aula possui vários registros `AulaAluno` (um por aluno presente/ausente na chamada).
- Uma aula pode ter se originado de uma `AulaProgramada` (relação 1:1 opcional via `AulaProgramada.aulaId`).

---

## AulaAluno

Registra a participação de um aluno em uma aula específica. Substituiu completamente o antigo modelo `Presenca`.

Campos

- id
- aulaId, alunoId
- presente
- respeito, valentia, esforco, atencao, disciplina
- observacao
- createdAt / updatedAt

Restrição: par (`aulaId`, `alunoId`) único.

---

## AulaProgramada

Agendamento prévio de uma aula, antes dela acontecer de fato.

Campos

- id, unidadeId
- turmaId
- aulaCurriculoId (opcional — plano de aula a ser seguido)
- data
- observacoes
- status (`PENDENTE` | `INICIADA` | `CANCELADA`)
- aulaId (opcional, único — preenchido quando a programação vira uma aula real)
- **professorSubstitutoId** (opcional, FK para Usuario) — professor que assume essa ocorrência específica quando o titular está impedido
- **motivoTransferencia** (opcional) — justificativa obrigatória no momento da transferência
- createdAt / updatedAt

Regras de transferência: ver `regras-de-negocio.md`, seção "Transferência de Aula" (RN-180 a RN-185).

---

## Graduacao

Histórico oficial de graduações do aluno.

Campos

- id, unidadeId
- faixa
- data
- alunoId

Objetivo: nunca perder histórico — cada linha é um evento de graduação (não há edição retroativa de faixas anteriores).

---

## Mensalidade

Controle financeiro.

Campos

- id, unidadeId
- valor
- vencimento
- dataPagamento (opcional)
- pago (boolean, default false)
- descricao (opcional)
- alunoId

O status "atrasada"/"pendente" é derivado (vencimento no passado + `pago = false`), não é um campo próprio.

---

## Plano

Plano de mensalidade oferecido pela unidade (ex.: mensal, trimestral).

Campos

- id, unidadeId
- nome
- valor
- periodicidade
- ativo
- createdAt

Relacionamento: um Plano pode estar vinculado a vários Alunos (`Aluno.planoId`).

---

## Competicao

Um evento/competição cadastrado pela unidade.

Campos

- id, unidadeId
- nome
- data
- local

Relacionamento: uma Competição possui vários atletas inscritos (`CompeticaoAluno`).

---

## CompeticaoAluno

Inscrição de um aluno em uma competição, com o resultado obtido.

Campos

- id
- competicaoId, alunoId
- resultado (opcional)

---

## Comportamento

Resumo comportamental do aluno (usado por relatórios agregados — o registro por aula fica em `AulaAluno`).

Campos

- id
- alunoId
- respeito, valentia, esforco, atencao, disciplina (inteiros — contagem acumulada)
- observacao
- createdAt

---

## Tecnica

Cadastro pedagógico de uma técnica (fora do contexto de um currículo específico).

Campos

- id, unidadeId
- nome
- categoria, subCategoria (opcionais)
- descricao
- faixaMinima, idadeMinima (opcionais)
- nivel (opcional)
- ordemCurriculo (opcional)
- ativa
- createdAt / updatedAt

Categorias usuais: Queda, Guarda, Passagem, Raspagem, Finalização, Defesa, Movimentação.

---

## Curriculo

Organização pedagógica de uma unidade, dividida em módulos.

Campos

- id, unidadeId
- nome, descricao
- modalidade (default "Jiu-Jitsu")
- publico (default "Kids")
- ativo
- createdAt / updatedAt

### ModuloCurriculo

Agrupa aulas planejadas por faixa etária/faixa de graduação.

Campos: id, nome, descricao, faixa, idadeMinima, idadeMaxima, ordem, curriculoId, createdAt/updatedAt.

### AulaCurriculo

Plano de aula: o que ensinar, com qual objetivo e quais jogos pedagógicos usar.

Campos: id, titulo, objetivo, descricao, duracaoMinutos, jogosSugeridos, ordem, moduloId, createdAt/updatedAt.

### TecnicaCurriculo

Técnicas recomendadas para uma aula planejada específica.

Campos: id, nome, categoria, descricao, obrigatoria, ordem, aulaCurriculoId, createdAt/updatedAt.

---

## AvisoReconhecido

Registra que um usuário já "reconheceu" (dispensou) um aviso/notificação do sistema (ex.: mensalidade vencida), para não repetir o alerta.

Campos

- id
- usuarioId
- tipo
- referenciaId
- criadoEm

Restrição: (`usuarioId`, `tipo`, `referenciaId`) único.

---

# Integridade

Todas as FKs utilizam integridade referencial. Exemplo: Aluno → Turma. Caso uma turma seja removida (inativada), não remover automaticamente os alunos vinculados.

---

# Índices

Recomendados

- Aluno: nome, cpf, turmaId, unidadeId
- Responsável: cpf, telefone
- Aula / AulaProgramada: turmaId, data, unidadeId
- Mensalidade: alunoId, pago, vencimento
- Competição: unidadeId, data
- Usuario: unidadeId, email (único), perfil

---

# Estratégia de Exclusão

Nunca excluir dados históricos. Utilizar `ativo = false` para: Aluno, Turma, Usuário, Responsável, Unidade, Arena, Plano.

Nunca apagar: Graduação, Competição, Aula, Mensalidade.

---

# Evolução

A estrutura já suporta multi-unidade (SaaS) e controle de acesso granular por perfil — capacidades que eram tratadas como visão de longo prazo e hoje já estão implementadas em produção.

Próximas evoluções previstas

- Área dos Pais (tabela `UsuarioResponsavel`)
- Área do Professor com especialidades
- Auditoria (tabela de log de alterações)
- Arquivos/documentos anexados ao aluno

---

# Boas práticas

Nunca acessar banco sem Service.

Nunca utilizar SQL manual.

Sempre utilizar Prisma.

Sempre criar migração (`npx prisma migrate dev`).

Nunca alterar banco diretamente.

Toda entidade operacional nova deve carregar `unidadeId` e ser filtrada via `escopoUnidade()`/`garantirAcessoUnidade()`.

---

# Fluxo de Dados

```
Unidade → Arena → Turma → Aluno → Aula/AulaAluno → Graduação → Prontuário
```

---

# Roadmap

Próximas entidades

- UsuarioResponsavel (Área dos Pais)
- Agenda
- Notificação
- Pagamento/PIX
- Auditoria
- Arquivos/Documentos

---

# Conclusão

O modelo de dados do Sys Belt - Sistema Faixa Preta representa toda a jornada do aluno, desde sua matrícula até sua evolução esportiva, mantendo histórico completo, isolamento multi-unidade e permitindo futuras expansões sem necessidade de remodelagem estrutural.
