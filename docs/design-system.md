# Design System

Versão: 1.0

Última atualização: Julho/2026

---

# Objetivo

O Design System do SGCL define todos os padrões visuais e de interação da aplicação.

Seu objetivo é garantir:

- consistência visual;
- facilidade de manutenção;
- reutilização de componentes;
- melhor experiência do usuário;
- rapidez no desenvolvimento de novas funcionalidades.

---

# Princípios

O Design System foi desenvolvido considerando cinco pilares.

## Clareza

A interface deve ser simples.

Toda informação importante deve ser facilmente encontrada.

---

## Consistência

Botões iguais devem funcionar da mesma maneira.

Formulários iguais devem possuir o mesmo comportamento.

---

## Simplicidade

Evitar excesso de informações.

Priorizar telas limpas.

---

## Rapidez

O usuário deve executar qualquer operação com poucos cliques.

---

## Escalabilidade

Todo novo componente deve poder ser reutilizado.

---

# Estrutura

Os componentes ficam organizados em:

```
components/

layout/

ui/

sgcl/
```

---

# Organização

## Layout

Componentes responsáveis pela estrutura da página.

Exemplos

Page

PageHeader

Sidebar

Header

Footer

Container

---

## UI

Componentes genéricos.

Button

Input

Textarea

Select

Checkbox

Radio

Loading

EmptyState

ConfirmDialog

Modal

Badge

Avatar

Tooltip

---

## SGCL

Componentes específicos do sistema.

InfoCard

StatusBadge

AlunoCard

MensalidadeCard

AulaAlunoCard

BehaviorSelector

DashboardCard

---

# Estrutura das páginas

Toda página deverá seguir o padrão:

```
<Page>

↓

<PageHeader>

↓

Resumo

↓

Filtros

↓

Conteúdo

↓

Ações
```

---

# Grid

Desktop

12 colunas

Tablet

6 colunas

Mobile

1 coluna

---

# Espaçamentos

Pequeno

8px

Médio

16px

Grande

24px

Extra

32px

---

# Bordas

Radius padrão

8px

Cards

12px

Botões

8px

Inputs

8px

---

# Tipografia

Família

Inter

Fallback

sans-serif

---

## Hierarquia

H1

32px

H2

24px

H3

20px

Título de Card

18px

Texto

16px

Texto secundário

14px

Legenda

12px

---

# Paleta Principal

## Primária

Azul institucional

## Secundária

Cinza claro

## Destaque

Verde

## Atenção

Amarelo

## Erro

Vermelho

---

# Estados

Sucesso

Verde

Aviso

Amarelo

Erro

Vermelho

Informação

Azul

---

# Botões

Primário

Ação principal

---

Secundário

Ações alternativas

---

Perigo

Exclusões

---

Outline

Ações discretas

---

Link

Navegação

---

# Inputs

Todos os inputs devem possuir:

Label

Placeholder

Mensagem de erro

Estado disabled

Estado readonly

---

# Formulários

Todos utilizam:

React Hook Form

+

Zod

---

# Tabelas

Toda tabela deverá possuir:

Cabeçalho

Paginação

Ordenação

Busca

Estado vazio

Loading

---

# Cards

Cards devem possuir:

Título

Conteúdo

Ações opcionais

---

# Status

Status são exibidos através do componente:

StatusBadge

Exemplos

ATIVO

INATIVO

ABERTA

FINALIZADA

PENDENTE

PAGA

ATRASADA

---

# Ícones

Biblioteca oficial

Lucide React

Todos os ícones devem possuir tamanho padronizado.

---

# Feedback

Loading

↓

Spinner

---

Erro

↓

Mensagem amigável

---

Sucesso

↓

Toast (implementação futura)

---

# Navegação

Sidebar

↓

Módulos

↓

Página

↓

Conteúdo

---

# Responsividade

Desktop

≥1200px

Notebook

992px

Tablet

768px

Mobile

<768px

---

# Acessibilidade

Todos os componentes devem possuir:

Labels

Contraste adequado

Navegação por teclado

Foco visível

Compatibilidade com leitores de tela

---

# Padrões de nomenclatura

Componentes

PascalCase

```
AlunoForm
```

CSS

```
styles.css
```

Tipos

```
types.ts
```

---

# Estrutura de componentes

Cada componente possui:

```
MeuComponente/

index.tsx

styles.css

types.ts
```

---

# Componentes existentes

Layout

- Page
- PageHeader

Feedback

- Loading
- StatusBadge
- EmptyState
- ConfirmDialog

Formulários

- Button
- Input
- Select
- Textarea
- ImageUpload

Cards

- InfoCard
- AulaAlunoCard

Pedagógicos

- BehaviorSelector

---

# Componentes planejados

Timeline

ProgressBar

Stepper

Calendar

Charts

Toast

Tabs

Accordion

Avatar

Breadcrumb

Notification

---

# UX

Toda ação importante deve possuir confirmação.

Exemplo

Excluir

Cancelar

Finalizar aula

Inativar aluno

---

# Roadmap

Dark Mode

Tema personalizado

Animações
ß
Modo compacto

Acessibilidade avançada

Internacionalização

---

# Conclusão

O Design System do SGCL garante que todas as telas da aplicação mantenham a mesma identidade visual e comportamento, reduzindo inconsistências e acelerando o desenvolvimento de novas funcionalidades.