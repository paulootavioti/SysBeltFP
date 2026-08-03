# Padrão de UX/UI

Fonte de verdade única do padrão visual e de interação do SysBeltFP —
substitui o antigo `docs/design-system.md`. Todo componente novo, e toda
refatoração de tela existente, deve seguir esta especificação.

Cobre os três frontends que compartilham a mesma identidade visual:
`sgcl-web` (admin/equipe), `sgcl-portal-familia` (Portal da Família) e
o módulo Área do Professor (dentro de `sgcl-web`). A landing page pública
(`landing-academia/`) é a única exceção, com paleta própria — ver seção
"Exceção: landing page".

---

## Paleta

| Papel | Cor | Token (sgcl-web / portal-familia) |
|---|---|---|
| Fundo da aplicação | `#FAF9F6` | `--color-background` |
| Superfície (card/modal) | `#FFFFFF` | `--color-surface` |
| Borda | `#E7E3D8` | `--color-border` |
| Texto principal | `#17140F` | `--color-text` |
| Texto secundário | `#726C60` | `--color-text-light` |
| Texto terciário/placeholder | `#A39C8C` | `--color-text-tertiary` |
| Marca/destaque | `#C9A227` | `--color-accent` |
| Marca sobre fundo escuro | `#E4C86B` | `--color-accent-light` |
| Fundo escuro (sidebar/header) | `#17140F` | `--color-primary` |
| Sucesso | `#1b7f3a` sobre `#e7f6ec` | `--color-success` / `--color-success-bg` |
| Atenção | `#8a6d1a` sobre `#F6EED0` | `--color-warning` / `--color-warning-bg` (= `--color-accent-soft`) |
| Erro/destrutivo | `#B3261E` sobre `#fdecea` | `--color-danger` / `--color-error-bg` |
| Neutro (chip informativo) | `#374151` sobre `#f3f4f6` | `--color-neutral-text` / `--color-neutral-bg` |

## Tipografia (Inter)

| Elemento | Tamanho/peso | Observação |
|---|---|---|
| h1 de página (admin/professor/ajuda) | 26px/700 | via `PageHeader` |
| h1 de página (Portal da Família) | 22px/700 | shell do Portal |
| Subtítulo de página | 14px/400, `#726C60` | |
| h2 de card/seção | 15px/700 | |
| Corpo | 14px | |
| Corpo secundário | 13px, `#726C60` | |
| Label de campo | 13px/600 | |
| Label de KPI | 11px/700, uppercase, `letter-spacing: .05em`, `#726C60` | |
| Número de KPI | 26px/700 | |
| Chip/badge | 11–12px/600–700 | |

Mínimos absolutos: 14px em conteúdo, 11px em labels/badges.

## Raios

| Uso | Valor | Token |
|---|---|---|
| Card/modal/painel | 12px | `--radius-lg` |
| Botão/input/select | 8px | `--radius-md` |
| Botão pequeno/chip dentro de card | 7px | `--radius-sm-plus` |
| Pill/badge | 999px | `--radius-full` |
| Thumbnail/avatar quadrado | 10px | `--radius-thumb` |

## Elevação

- **Sem sombra** em cards de conteúdo — a hierarquia vem da borda
  (`--color-border`), não de `box-shadow`.
- Sombra só em modal/drawer: `0 10px 30px rgba(0,0,0,.15)`
  (`--shadow-lg`).

---

## Larguras e layout

- **Sidebar** do sistema: 230px em todas as telas autenticadas de
  `sgcl-web`.
- **Header** superior: 68px, fundo branco, borda inferior
  `--color-border`.
- **Container de conteúdo**: padding 24px, centralizado, com
  `max-width` por contexto:
  - 1180px — admin (`sgcl-web`) e Área do Professor.
  - 920px — Portal da Família e vitrine da loja (`sgcl-portal-familia`).
  - 860px — Central de Ajuda (medida de leitura).
- **Espaçamento vertical** entre blocos de página: 20px no
  admin/professor, 18px no Portal da Família.
- **Grid de KPI**: 4 colunas, gap 14px, empilha em coluna única no
  mobile.

## Títulos

Toda tela precisa de h1 + subtítulo curto explicando o que ela faz —
usar sempre `PageHeader` (ou, no Portal da Família, o h1 do shell +
descrição da aba quando fizer sentido).

## Cards de KPI

- Estrutura única em todas as telas: label uppercase com
  `letter-spacing: .05em` + número 26px/700.
- Cor no número **apenas** quando comunica estado (vermelho para
  estoque baixo, pendência financeira etc.) — nunca decorativa.
- Sem `box-shadow` — hierarquia por borda.

---

## Componentes compartilhados (`sgcl-web/src/components/ui`)

1. **`PageHeader`** — h1 + subtítulo + slot de ações à direita
   (`action?: ReactNode`). Usar em toda página.
2. **`Card` + `DashboardKpiCard`** — card genérico sem sombra;
   `DashboardKpiCard` aplica a tipografia de KPI (label/número) por
   cima do `Card` via `className`.
3. **`FilterBar`** — busca (`flex:1`) + selects à direita + pills
   removíveis mostrando os filtros ativos.
4. **`EmptyState`** — borda 1px dashed `--color-border`, padding 32px,
   texto centralizado 14px `--color-text-light`, mensagem específica de
   contexto (nunca genérica).
5. **`Badge`** (variante genérica: success/danger/warning/info/neutral)
   e **`StatusBadge`** (status de domínio fechado: ATIVO/PAGO/VENCIDO
   etc.) — cobrem juntos o que seria um "StatusChip": mesmos pares de
   cor da paleta acima, escolha entre os dois conforme o dado for uma
   variante genérica ou um status de domínio específico.
6. **`ConfirmDialog`** — substitui todo `window.confirm`/`alert`.
7. **`TrilhaFaixa`** — swatch circular 18px, borda 1.5px solid
   `#d8d2c2`, gradiente 135° para faixas mistas. Usar em qualquer lugar
   que mostre a faixa de um aluno.
8. **`FrequenciaIndicador`** — percentual + barra, cor por faixa de
   aproveitamento (≥80% sucesso, 60–79% atenção, <60% erro). Usar em
   prontuário, detalhes do aluno, detalhes da turma e Portal da
   Família.
9. **`Modal`** — larguras: 420px (confirmação), 560px (formulário,
   padrão), 600px (formulário com repeater); `max-height: 90vh` com
   scroll interno; header com título 18px + botão ×; footer com
   Cancelar (secundário) + ação primária à direita.
10. **`Accordion`** — chevron rotacionando 90° via
    `transform`/`transition: transform .15s`.

---

## Botões — hierarquia clara

| Variante | Estilo | Quando usar |
|---|---|---|
| Primário | fundo `#17140F`, texto branco, padding 10px 16px, 14px/600 | ação principal da tela (só UMA por tela) |
| Secundário | fundo branco, borda `#E7E3D8`, texto `#17140F`, 13px/600 | navegação, editar, ações neutras |
| Destrutivo | `#B3261E` | excluir, inativar, cancelar |
| Marca | fundo `#C9A227`, texto `#17140F` | CTA de engajamento (ex. iniciar tour) |

"Editar" e "Ver detalhes" são ações diferentes e devem ser
distinguíveis; ações destrutivas nunca têm o mesmo peso visual de ações
neutras.

## Interação e microcomportamento

- Hover em card clicável: `border-color: #C9A227`.
- Hover em botão secundário: `background: #F6EED0`.
- Hit target mínimo 44×44px no mobile; linhas de lista tocáveis com
  56px.
- Toda lista longa tem busca; toda busca tem estado vazio próprio com
  mensagem do contexto ("Nenhum aluno encontrado para 'X'"), nunca
  texto genérico.
- Todo formulário valida no submit e mostra erro inline em vermelho
  (`#B3261E`, 13px/600) acima dos botões — não em `alert`.
- Toda ação que grava mostra feedback (toast ou mensagem inline de
  sucesso).

## Navegação

- Sistema e Área do Professor: sidebar fixa em desktop, drawer no
  mobile.
- Portal da Família: abas no topo em desktop, bottom tab bar no
  mobile. A vitrine da loja é uma aba desse mesmo portal — usa a MESMA
  navegação, não um header próprio.
- Central de Ajuda: sidebar de categorias em desktop, chips
  horizontais com scroll no mobile.
- Nomes de rota, item de menu e título da página precisam coincidir.

---

## Exceção: landing page

`landing-academia/` (site público institucional) tem paleta própria:
fundo `#0D0B08`, destaque `#D62828`. Nunca misturar o vermelho da
landing com o dourado do sistema.
