# Frontend

Versão do documento: 1.0

Última atualização: Julho/2026

---

# Objetivo

O frontend do SGCL Kids foi desenvolvido utilizando React + TypeScript e segue uma arquitetura modular baseada em domínio.

Cada módulo da aplicação é independente, contendo suas próprias páginas, componentes, serviços, tipos, validações e utilitários.

O objetivo é manter:

- Baixo acoplamento
- Alta reutilização
- Fácil manutenção
- Escalabilidade
- Código limpo

---

# Stack

Framework

- React 19

Linguagem

- TypeScript

Roteamento

- React Router

Requisições

- Axios

Formulários

- React Hook Form

Validação

- Zod

Gerenciamento de estado

- Context API

---

# Estrutura

```

src/

components/

contexts/

modules/

pages/

routes/

services/

shared/

styles/

App.tsx

main.tsx

```

---

# Organização

O projeto possui dois níveis de componentes.

## Componentes Globais

São utilizados por toda aplicação.

Exemplo

```

components/

layout/

ui/

sgcl/

```

---

## Componentes dos módulos

Cada módulo possui seus próprios componentes.

Exemplo

```

modules/

alunos/

components/

AlunoForm/

ContatoSection/

SaudeSection/

```

---

# Estrutura de um módulo

Cada módulo segue a mesma organização.

```

modules/

alunos/

components/

pages/

services/

schema/

types/

mappers/

utils/

```

---

# Pages

As páginas representam telas completas.

Exemplo

```

Listar

Cadastrar

Editar

Prontuario

```

Uma página nunca deve conter regra de negócio.

Ela apenas:

- chama serviços
- controla estado
- renderiza componentes

---

# Components

Componentes representam partes reutilizáveis.

Exemplos

AlunoForm

TurmaSection

ContatoSection

MensalidadeCard

AulaAlunoCard

BehaviorSelector

---

# Services

Responsáveis pela comunicação com a API.

Exemplo

```

AlunoService.buscar()

AlunoService.listar()

AlunoService.criar()

```

Nenhuma página faz chamadas HTTP diretamente.

---

# ApiClient

Toda comunicação passa pelo ApiClient.

```

ApiClient

↓

JWT

↓

Express

```

Exemplo

```

ApiClient.get()

ApiClient.post()

ApiClient.put()

ApiClient.patch()

```

---

# Contexts

Hoje existe:

AuthContext

Responsável por:

- Login
- Logout
- Usuário autenticado
- Token JWT

---

# Hooks

Sempre que uma lógica puder ser reutilizada ela deverá virar um hook.

Exemplo

```

useMensalidades()

useDashboard()

useAulas()

```

---

# Tipos

Cada módulo possui seus próprios tipos.

Exemplo

```

types/

Aluno.ts

Turma.ts

Mensalidade.ts

```

Nunca utilizar any.

---

# Schema

Validação utilizando Zod.

Exemplo

```

aluno.schema.ts

responsavel.schema.ts

```

Esses schemas são compartilhados pelo React Hook Form.

---

# Mappers

Responsáveis por adaptar dados da API para o formulário.

Exemplo

```

alunoParaFormulario()

formatarData()

```

---

# Utils

Funções auxiliares.

Exemplo

```

status.ts

datas.ts

formatadores.ts

```

---

# Fluxo

Usuário

↓

Página

↓

Service

↓

ApiClient

↓

Backend

↓

Response

↓

Página

↓

Componentes

---

# Layout

Toda tela utiliza:

```

<Page>

↓

<PageHeader>

↓

<Section>

↓

Cards

↓

Botões

```

---

# Design System

O SGCL possui Design System próprio.

Componentes principais

Page

Section

InfoCard

StatusBadge

Loading

EmptyState

ConfirmDialog

Modal

Button

Input

Select

Textarea

Card

Table

---

# Organização visual

Cada tela deve possuir.

Título

↓

Resumo

↓

Filtros

↓

Conteúdo

↓

Ações

---

# Formulários

Todos seguem o padrão.

React Hook Form

↓

Zod

↓

Components

↓

Submit

---

# Navegação

React Router

Estrutura

```

/

login

/dashboard

/alunos

/alunos/cadastro

/alunos/:id

/alunos/:id/editar

/alunos/:id/prontuario

/turmas

/turmas/:id 

/aulas

/mensalidades

/graduacoes

/graduacoes/proximas

/financeiro

/competicoes

/competicoes/:id

/relatorios

/planejamento

/usuarios

/aulas/programacao

```

---

# Controle de acesso

Após login.

JWT

↓

Context

↓

ApiClient

↓

Authorization Bearer

---

# Tratamento de erros

Toda chamada HTTP deve tratar erros.

Exemplo

```

try{

}

catch{

toast()

}

```

Nunca exibir mensagens técnicas ao usuário.

---

# Loading

Todas as páginas devem possuir estados de:

Loading

Erro

Sem dados

Conteúdo

---

# Responsividade

Objetivo

Desktop

Notebook

Tablet

Futuramente

Mobile

---

# Paleta

As cores são definidas pelo Design System.

Não utilizar cores diretamente nos componentes.

---

# Convenções

Componentes

PascalCase

```

AlunoForm

```

Hooks

camelCase iniciado por use

```

useAuth()

```

Tipos

PascalCase

```

Aluno

```

Interfaces

PascalCase

```

AlunoFormData

```

---

# Organização de CSS

Cada componente possui seu próprio arquivo.

```

index.tsx

styles.css

types.ts

```

---

# Princípios

- Componentes pequenos
- Reutilização máxima
- Nenhuma regra de negócio nas páginas
- Services responsáveis pela API
- Design System centralizado
- Tipagem forte
- Arquivos pequenos

---

# Roadmap Frontend

Próximas evoluções

- Tema escuro
- Upload de imagens
- Toasts globais
- Skeleton Loading
- Tabelas inteligentes
- Filtros avançados
- Dashboard executivo
- Área dos Pais
- Área do Professor
- Aplicação Mobile

---

# Conclusão

O frontend do SGCL Kids foi projetado para ser modular, escalável e consistente. Todo novo desenvolvimento deve seguir os padrões descritos neste documento para manter a organização e a experiência do usuário em toda a aplicação.