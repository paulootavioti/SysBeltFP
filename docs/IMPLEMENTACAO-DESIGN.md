# Sys Belt — especificação de implementação

Documento único de handoff. Sintetiza a avaliação de design de Setembro/2026 em tarefas
implementáveis. Escrito para ser lido por um agente de código com acesso ao repositório
`SysBeltFP`.

Salve este arquivo como `docs/IMPLEMENTACAO-DESIGN.md` no repositório.

**Regras de leitura deste documento**

- Todo caminho de arquivo é relativo à raiz do repositório `SysBeltFP`.
- "Estado atual" descreve o que está no código hoje e foi verificado por leitura direta.
- "Alvo" é o que deve passar a existir.
- "Aceite" é o critério objetivo de conclusão. Se não passa no aceite, a tarefa não terminou.
- Onde aparece **NÃO ENCONTRADO**, significa que a busca no repositório não localizou o
  artefato. Confirme antes de criar — pode existir fora do que foi inspecionado.
- Nenhuma tarefa aqui pede reescrita de backend. Onde o backend é citado, é porque o dado
  **já existe** e só precisa ser exposto.

**Referências visuais** (arquivos de design que acompanham esta especificação)

| Arquivo | Conteúdo |
| --- | --- |
| `Avaliacao de Design SysBelt` | Laudo: notas, evidências, jornadas, recomendações |
| `Telas Atuais - Antes` | Telas atuais recriadas do código (A1–A6) |
| `Redesenho - Depois` | Telas redesenhadas (B1–B5) |
| `Portal Professor - Modo Aula v2` | Ring timer, plano compilado, comandos de voz (3a–3c) |

---

## 0. Princípios que governam todas as tarefas

1. **Uma linguagem visual.** A linguagem da `landing/` passa a ser a linguagem do produto:
   Archivo, raio 0, réguas de 2px, tudo alinhado à esquerda, tinta sobre fundo claro, um
   único acento. Não inventar uma quinta.
2. **O dourado `#C9A227` deixa de ser cor funcional.** Contraste de ~2,1:1 sobre `#FAF9F6`
   reprova para texto (4,5:1) e para chrome/ícones (3:1). Ele permanece como motivo de
   marca. Estados funcionais usam tinta ou um acento de alto contraste.
3. **Não duplicar.** Onde existirem dois componentes para a mesma função, escolher um,
   migrar os usos e apagar o outro no mesmo PR.
4. **Não criar módulo novo onde há campo faltando.** Vale para o Modo Aula v2 (§5): a
   capacidade nasce de um campo de duração no currículo, não de um módulo.
5. **Mínimos não negociáveis** (já escritos em `docs/ux-padrao.md`, hoje não cumpridos em
   todos os pontos): alvo de toque ≥ 44px; `font-size` ≥ 16px em campos de formulário;
   foco de teclado visível em todo elemento interativo; ação destrutiva nunca com o mesmo
   peso visual de ação neutra.

---

## 1. Fase 1 — Bloqueadores (2 a 3 semanas)

### 1.1 Carregar a fonte

**Estado atual.** `sgcl-web`, `sgcl-portal-familia` e `sgcl-portal-professor` declaram a
pilha `"Inter", Arial, Helvetica, sans-serif` em `src/styles/variables.css` e **nenhum dos
três importa Inter** — nem via `@fontsource`, nem via `<link>` do Google Fonts, nem
localmente. Em Windows a pilha resolve para Arial. `landing-academia/index.html` carrega
Inter do Google Fonts; `landing/` carrega Archivo.

**Alvo.** Adotar **Archivo** nos três frontends e no Control Plane, unificando com a
`landing/`. Uma única declaração `--font-heading` / `--font-body`, com a fonte efetivamente
carregada e `font-display: swap`.

**Arquivos.**
- `sgcl-web/index.html`, `sgcl-portal-familia/index.html`, `sgcl-portal-professor/index.html`,
  `control-plane/web/index.html` — adicionar o carregamento da fonte.
- `sgcl-web/src/styles/variables.css` e os equivalentes dos portais — trocar a pilha.
- `control-plane/web/src/styles.css` — hoje usa `system-ui, -apple-system, "Segoe UI", Roboto`.

**Aceite.** `getComputedStyle(document.body).fontFamily` resolve para Archivo nos quatro
apps, e a fonte aparece na aba Network como recurso carregado.

---

### 1.2 Auditoria de contraste

**Estado atual.** `#C9A227` é usado como cor funcional em pelo menos estes pontos:

| Uso | Arquivo | Situação |
| --- | --- | --- |
| Fundo de item ativo da sidebar | `sgcl-web/src/components/layout/Layout/styles.css` | Aceitável — texto `#17140F` sobre dourado |
| Fundo de botão de paginação ativo | `sgcl-web/src/components/ui/Pagination/styles.css` | **Reprova** — sobre fundo claro |
| Barra de gráfico do dashboard | componentes de `src/modules/dashboard/` | **Reprova** |
| Título "Sys Belt" na sidebar | `Layout/styles.css` | Aceitável — sobre `#17140F` |
| Cor de link/sublinhado ativo | `landing/styles.css` | **Reprova** — existe `--gold-text: #7a6212` no mesmo arquivo, não aplicado em todos os pontos |

**Alvo.** Nenhum texto, ícone, borda de estado ou chrome funcional depende de dourado puro
sobre fundo claro. Sobre fundo claro usar `--gold-text` (`#7a6212`) ou tinta; dourado só
sobre `#17140F` ou como preenchimento decorativo sem carga informativa.

**Aceite.** Varredura automatizada (axe-core ou equivalente) retorna **zero** violações de
contraste AA em texto nas quatro superfícies. Nenhum ícone ou borda de estado abaixo de
3:1.

---

### 1.3 Anel de foco global

**Estado atual.** **NÃO ENCONTRADO** nenhum `:focus-visible` nos componentes de UI de
`sgcl-web` e dos portais. `landing/styles.css` tem `outline: 2px solid var(--gold)` e
`control-plane/web/src/styles.css` tem `outline: 2px solid var(--destaque)`. Os dois apps
mais usados são justamente os que não têm.

**Alvo.** Regra global nos três frontends, copiando o padrão que a landing já usa:

```css
:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
```

`--color-focus` deve passar o mínimo de 3:1 contra os dois fundos (`#FAF9F6` e `#17140F`) —
não usar `#C9A227`.

**Aceite.** Percorrer cada tela inteira por Tab sem perder o foco de vista em nenhum passo.
Inclui itens de sidebar, linhas de tabela clicáveis, abas do portal e botões dentro de
modais.

---

### 1.4 Portal da Família — 8 abas viram 5 + "Mais"

**Estado atual.** `sgcl-portal-familia/src/modules/portal/pages/Portal/index.tsx` declara
**oito abas**. `src/components/ui/Tabs/styles.css` aplica `flex: 0 0 76px` por aba, com
`scrollbar-width: none`. 8 × 76 = 608px de trilha em uma viewport de 390px: cinco abas
aparecem e **Documentos, Mensagens e Conta ficam fora da tela sem nenhuma affordance
visual**. Mensagens é a aba que carrega o badge de não lidas — o responsável recebe uma
notificação cuja origem ele não consegue alcançar.

**Alvo.** Cinco destinos na barra inferior: **Início · Evolução · Pagar · Falar · Mais**.
- `Falar` = Mensagens, e leva o badge de não lidas.
- `Mais` abre uma folha com Loja, Documentos, Agenda e Conta.
- Abas passam a `flex: 1` (divisão igual da largura), altura mínima 60px, rótulo sempre
  visível.

Ver `Portal Professor - Modo Aula v2` não se aplica aqui; a referência visual é `B4` em
`Redesenho - Depois`.

**Aceite.** Em viewport de 320px de largura, as cinco abas são visíveis simultaneamente e
nenhuma exige rolagem horizontal. O badge de não lidas é alcançável em um toque.

---

### 1.5 Portal da Família — "tem aula hoje?" no topo

**Estado atual.** `ResumoTab` abre com um grid de cartões de status (faixa, frequência,
mensalidade). A pergunta real de quem abre o app é *tem aula hoje e a que horas*, e ela não
é a primeira coisa na tela.

**Alvo.** Bloco de próxima aula como primeiro elemento do `ResumoTab`: dia, hora, turma,
arena e professor, em tipografia de display. Faixa, frequência e mensalidade descem para
linha de apoio.

**Aceite.** Dia e hora da próxima aula legíveis sem rolagem em viewport de 844px de altura.

---

### 1.6 Portal da Família — bloco de privacidade

**Estado atual.** O portal exibe faixa, frequência, mensalidade, fotos de treino e
documentos de menores de idade. **NÃO ENCONTRADO** no shell do portal nenhuma menção a
privacidade, LGPD, consentimento ou link para gestão de consentimentos. O backend **já tem
o módulo**: `src/modules/consentimentos/` guarda versão de texto, responsável, IP,
dispositivo e revogação. O dado existe e não é exposto a quem mais precisa dele.

**Alvo.**
1. Linha permanente no `ResumoTab`: quem vê os dados da criança, com link para a tela de
   privacidade.
2. Tela `Privacidade e consentimentos`: lista de consentimentos ativos (imagem, dados de
   saúde, comunicações), data e responsável de cada um, e ação de revogar.
3. Item na barra "Mais".

**Aceite.** Um responsável consegue, em dois toques a partir da tela inicial, ver quais
consentimentos deu e revogar um deles. Cada consentimento exibe a data e o texto da versão
aceita.

---

### 1.7 Aposentar a chamada legada de `sgcl-web`

**Estado atual.** Há **três caminhos** para a mesma tarefa, com três qualidades diferentes:

| Caminho | Arquivo | Qualidade |
| --- | --- | --- |
| Modo Aula do portal | `sgcl-portal-professor/src/modules/portal/pages/Aula/index.tsx` | Quatro etapas (`Etapa1Presenca` → `Etapa4Foto`), `useCronometro`, `useWakeLock`, `useSincronizarFila`, `estadoAula`, marcação otimista com rollback |
| Chamada do sistema | `sgcl-web/src/modules/aulas/pages/Chamada/index.tsx` | Quatro `InfoCard` empilhados antes do primeiro aluno, sem cronômetro, sem wake lock, sem offline, sem contador fixo, `Finalizar Aula` no fim da página, emojis 🎯 🎮 que nenhuma outra tela usa |
| Área do Professor | `sgcl-web/src/modules/professor/pages/AreaDoProfessor` | Intermediária |

Na versão de `sgcl-web`, o primeiro aluno da lista fica a aproximadamente **1.100px de
rolagem** — os quatro `InfoCard` repetem turma e professor, dados já presentes no título da
página.

**Alvo.** O Portal do Professor é o único caminho de chamada.
1. Rota `/aulas/:id/chamada` em `sgcl-web/src/routes/index.tsx` passa a redirecionar para o
   portal.
2. Item "Área do Professor" sai de `sgcl-web/src/shared/constants/navegacao.ts`.
3. `sgcl-web/src/modules/aulas/pages/Chamada/` e `modules/professor/pages/AreaDoProfessor/`
   removidos, junto com seus `styles.css`.

**Antes de executar**, confirmar com o produto se existe caso de uso de chamada retroativa
pela recepção em desktop. Se existir, a tela desktop sobrevive **como lançamento
retroativo** — nome, rota e copy diferentes — e nunca como chamada ao vivo.

**Aceite.** Nenhuma rota de `sgcl-web` renderiza uma lista de presença ao vivo. Professor
autenticado que acessa qualquer URL antiga de chamada cai no Modo Aula do portal.

---

### 1.8 Prévia na importação de CSV

**Estado atual.** O modal de importação (`alunos-arquivo`, borda tracejada, em
`sgcl-web/src/modules/alunos/`) grava linha por linha. **NÃO ENCONTRADO** prévia, contagem
antes de confirmar, deduplicação ou desfazer. A primeira ação real de um cliente novo é
irreversível.

**Alvo.** Fluxo em dois passos.
1. **Passo 1 — prévia.** Tabela com as primeiras 20 linhas parseadas, contagem total,
   contagem de linhas com erro (com o motivo por linha) e contagem de duplicados detectados
   por nome + data de nascimento. Nada é gravado neste passo.
2. **Passo 2 — confirmação.** Botão declara o número exato: `Importar 84 alunos`. Duplicados
   têm escolha explícita: ignorar ou atualizar.
3. Após gravar, oferecer `Desfazer esta importação` por 24h, identificando o lote.

**Aceite.** Nenhuma escrita no banco acontece antes do clique de confirmação. Um CSV com 3
linhas inválidas mostra as 3 com o motivo, antes de gravar, e permite prosseguir com o
resto.

---

## 2. Fase 2 — Sistema e eficiência (próximo trimestre)

### 2.1 Pacote de tokens compartilhado

**Estado atual.** `sgcl-web/src/styles/variables.css`,
`sgcl-portal-familia/src/styles/variables.css` e o equivalente em `sgcl-portal-professor`
são **o mesmo arquivo duplicado linha por linha, incluindo os comentários**. O Control Plane
não usa nenhum deles: tem o seu próprio `control-plane/web/src/styles.css` com 563 linhas,
paleta escura (`--fundo #0f1216`, `--superficie #171b21`, `--borda #262c35`,
`--texto #e8ebef`, `--texto-fraco #97a1ad`) e um dourado próprio (`--destaque #d4a029`) que
não é o `#C9A227` da marca.

Levantamento completo das quatro linguagens:

| | `landing/` | `sgcl-web` + portais | `landing-academia/` | `control-plane/web` |
| --- | --- | --- | --- | --- |
| Fonte | Archivo (carregada) | Inter → cai em Arial | Inter (carregada) | system-ui |
| Fundo | `#faf9f6` | `#FAF9F6` | `#FAF9F6` / `#0D0B08` | `#0f1216` |
| Acento | `#c9a227` | `#C9A227` | `#D62828` | `#d4a029` |
| Raio | 0px | 8 / 12 / 999px | variado | 10px |
| Réguas | 2px sólidas | 1px `#E7E3D8` | 1px translúcida | 1px `#262c35` |
| Escala de type | `clamp()` fluido | px fixo | px fixo | rem |

**Alvo.** `packages/design-tokens` com um único arquivo de tokens, consumido pelos quatro
frontends. Um tema claro e um tema escuro derivados dos **mesmos** tokens — o Control Plane
passa a ser o tema escuro do mesmo sistema, não uma linguagem separada (referência: `B5`).

Tokens mínimos: cor (`bg`, `surface`, `text`, `muted`, `divider`, `accent`, `danger`,
`success`, `focus`, mais rampas), tipografia (`font-heading`, `font-body`, escala),
espaçamento, raio (0), sombra, e larguras de layout.

**Dependência.** Decidir a direção visual antes (§0.1).

**Aceite.** Uma mudança de cor de marca é aplicada em **um** commit, em um arquivo, e
aparece nos quatro apps. Nenhum `variables.css` duplicado permanece no repositório.

---

### 2.2 Corrigir a especificação de largura da sidebar

**Estado atual.** `docs/ux-padrao.md` afirma "Sidebar do sistema: 230px em todas as telas
autenticadas". `sgcl-web/src/components/layout/Layout/styles.css` declara `width: 280px`.

**Alvo.** Escolher um valor, aplicar no código e corrigir o documento. A recomendação é
**232px**, com os grupos de navegação reorganizados (§2.4).

**Aceite.** Código e `docs/ux-padrao.md` declaram o mesmo número.

---

### 2.3 Unificar os componentes duplicados

**Estado atual.**

1. **Dois `StatusBadge`.** `sgcl-web/src/components/ui/StatusBadge/` (pílula com
   `min-width: 90px`, 6 estados de domínio) e
   `sgcl-web/src/components/sgcl/feedback/StatusBadge/` (envelopa `Badge`, 4 estados). A
   tela de Chamada usa o segundo; a lista de Alunos usa o primeiro. O mesmo dado com dois
   desenhos.
2. **Duas famílias de layout.** `components/layout/Layout` + `components/layout/PageHeader`
   e o conjunto `components/sgcl/layout/Page` + `Section` + `cards/InfoCard`. A tela de
   Chamada aninha um `<main>` dentro de outro `<main>`.
3. **CSS morto.** `.alunos-table` não é mais usado.

**Alvo.** Um `StatusBadge`, uma família de layout, zero CSS morto. Migrar todos os usos e
apagar o perdedor no mesmo PR.

**Aceite.** `grep` por `StatusBadge` retorna um único componente. Nenhum `<main>` aninhado
em nenhuma rota. `grep` por `alunos-table` não retorna nada.

---

### 2.4 Dashboard como painel de decisão

**Estado atual** (referência visual `A1`). Oito KPIs de peso visual idêntico em duas
fileiras, seguidos de nove seções empilhadas com cabeçalhos iguais de 20px. O número do KPI
é 26px/700 — **exatamente o mesmo tamanho do `h1` da página**
(`components/layout/PageHeader/styles.css`). Não há um número que se leia primeiro. A seção
"Atenção do Gestor", a única que gera decisão, é a **sexta de nove**.

**Alvo** (referência visual `B1`).

1. **Três números primários** em ~46px: Receita do período, Alunos ativos, Frequência. Cada
   um com uma linha de contexto abaixo (comparação com o período anterior, composição).
2. **Cinco secundários** em ~22px, em faixa única: Ticket médio, Inadimplência, Graduações,
   Matrículas por semana, Leads abertos.
3. **"Exige uma decisão sua"** passa a ser o corpo da tela: lista de itens, cada linha com
   etiqueta de área, a frase do problema e **um botão de ação** (`Cobrar`, `Abrir`,
   `Graduar`, `Ver`).
4. O `h1` da página sobe para ~34px; nenhum KPI compete com ele.
5. Seções restantes saem do painel ou descem para links.
6. **Unidade ativa visível no header**: hoje é um `<select>` anônimo no canto
   (`components/layout/SeletorUnidadeAtiva`), e todos os números da tela dependem dele.
   Passa a rótulo permanente — `Unidade: Asa Norte` + ação `trocar`.

**Aceite.** Em 1440×920 sem rolagem: três números grandes, a lista de decisões com ação por
linha, e a unidade ativa nomeada em texto.

---

### 2.5 Lista de alunos — uma ação por linha

**Estado atual** (referência visual `A2`).

- **45 alvos de clique por página**: três botões por linha (`Detalhes`, `Editar`,
  `Inativar`) × 15 linhas.
- A ação **destrutiva é a mais chamativa** de cada linha: `Inativar` é `#B3261E` e tem o
  mesmo tamanho de `Detalhes`. `docs/ux-padrao.md` manda o contrário.
- **A coluna de ações não cabe.** Com sidebar de 280px, `.page { max-width: 1180px }` e
  `padding: 24px` (`Layout/styles.css`), sobram ~1134px para uma tabela que mede ~1305px com
  as oito colunas. Duas pílulas de `min-width: 90px` por linha (Status + Financeiro) mais
  três botões não cabem juntas: em um monitor de 1440px, `Ações` só é alcançável rolando o
  `.table-wrapper` na horizontal.
- **Filtro e paginação são client-side** (`usePaginacaoCliente`, `alunos.filter`): a busca só
  encontra dentro do que já foi carregado.
- Apelido e turma existem **só em `Tooltip`** — não chegam ao toque nem ao leitor de tela.

**Alvo** (referência visual `B2`).

1. Linha inteira clicável abre o aluno. Uma ação textual `Abrir` e um menu `⋯` para
   `Editar` / `Inativar`. Destrutiva sai da superfície.
2. Colunas: **Aluno** (nome + segunda linha com idade e responsável), Faixa, Turma,
   Frequência, Mensalidade, ação.
3. **Estado em palavras, não em pílula**: `Vencida há 12 dias`, `vence em 3 dias`, `em dia`.
   Elimina as duas pílulas de 90px por linha e libera a largura que falta.
4. Apelido e turma como segunda linha do nome, não como tooltip.
5. **Busca e paginação no servidor.**

**Aceite.** Buscar um aluno que está na página 6 de 6 o encontra. A coluna de ação é visível
em 1440px sem rolagem horizontal. Nenhuma linha tem mais de dois alvos de clique visíveis.

---

### 2.6 Campos de formulário e zoom no iOS

**Estado atual.** Os componentes de input usam `font-size: 14px`
(`components/ui/Input/styles.css`, `Select/styles.css`, `FilterBar/styles.css`). Abaixo de
16px, o Safari no iOS aplica zoom automático ao focar o campo, e a viewport não volta ao
lugar.

**Alvo.** `font-size: 16px` em todo campo de entrada (`input`, `select`, `textarea`) em
viewports de toque.

**Aceite.** Focar qualquer campo em um iPhone real não altera o nível de zoom.

---

### 2.7 PWA nos dois portais

**Estado atual.** **NÃO ENCONTRADO** `manifest.json`, service worker, ícone de instalação
ou código de push em `sgcl-portal-familia/public/`, `sgcl-portal-familia/src/`,
`sgcl-portal-professor/public/` ou `sgcl-portal-professor/src/`.

O Portal do Professor já tem `useSincronizarFila` (fila offline) e `useWakeLock`. Um app com
fila offline e wake lock que não instala na tela inicial é um paradoxo.

**Alvo.** `manifest.json` (nome, ícones 192/512, `display: standalone`, cor de tema dos
tokens), service worker com cache de shell, e prompt de instalação.

Prioridade: Portal do Professor primeiro (é pré-requisito do §5), Portal da Família em
seguida.

**Aceite.** Os dois portais são instaláveis no Android e no iOS e abrem sem chrome de
navegador. O Modo Aula funciona com o avião ligado e sincroniza ao voltar a rede.

---

### 2.8 Pix — botão de copiar

**Estado atual.** O QR e o código copia-e-cola existem
(`sgcl-portal-familia/src/modules/portal/.../PagamentoPix.tsx`, classe
`loja-tab-pix-codigo`), mas o código Pix é uma `textarea` de 88px de altura. **NÃO
ENCONTRADO** botão de copiar com confirmação — que é o gesto padrão desse fluxo.

**Alvo.** Botão `Copiar código Pix` acima do código, com confirmação visível por ~2s
(`Copiado`), usando `navigator.clipboard` com fallback. A `textarea` vira texto truncado com
`aria-label`.

**Aceite.** Um toque copia o código e a confirmação aparece. Nenhum usuário precisa
selecionar texto manualmente.

---

### 2.9 Onboarding da landing da academia

**Estado atual.** `landing-academia/` é entregue como template. No arquivo:
- `og:url` contém o valor **`"pt_BR"`** (copiado do `og:locale`);
- **NÃO ENCONTRADO** `og:image`;
- endereço, telefone e horário no `schema.org` são placeholders — os próprios comentários do
  HTML dizem isso;
- há três arquivos de estilo no mesmo diretório, incluindo `captacao.css`.

Se cada academia recebe este template ao assinar, **cada assinante publica um site com
metadados quebrados e um endereço que não é o dele**. Isso é um defeito de onboarding do
produto, não da landing.

**Alvo.**
1. Passo no onboarding que coleta nome, endereço, telefone, WhatsApp, horários, foto de capa
   e domínio.
2. Geração do site com `og:url`, `og:image`, `og:title` e `schema.org/SportsActivityLocation`
   corretos, a partir desses dados.
3. Unificar os três arquivos de estilo em um, sobre os tokens do §2.1.

**Aceite.** Um assinante novo publica a landing sem editar HTML, e o compartilhamento no
WhatsApp mostra a imagem e o nome corretos.

---

### 2.10 Preço com uma fonte de verdade

**Estado atual.** O valor "R$ 37 por faixa de 10 alunos" está escrito à mão no HTML da
`landing/`. O mesmo preço é calculado no backend em `precoPlataforma.ts` e exibido no
Control Plane. **Três fontes de verdade para o número que fecha a venda.**

**Alvo.** `precoPlataforma.ts` é a única fonte. A landing e o Control Plane leem dele (build
time ou endpoint público).

**Aceite.** Alterar o preço em um lugar muda os três pontos de exibição.

---

## 3. Fase 3 — Expansão

- **Control Plane sobre os tokens compartilhados**, em tema escuro (referência `B5`).
  Elimina a quarta linguagem sem perder a densidade de ferramenta interna. Números de topo
  (MRR, assinantes, falhas de provisionamento) ganham hierarquia real — hoje os `h2` são
  0,95rem em cinza e os números vivem em `<li>` de lista.
- **Central de privacidade do assinante**: exportar a própria base, ver consentimentos,
  solicitar anonimização e exclusão de conta. **NÃO ENCONTRADO** nenhuma dessas telas em
  nenhum dos frontends. É conformidade e argumento de venda ao mesmo tempo.
- **Check-in do aluno** como superfície própria (totem ou QR na recepção), fechando o ciclo
  entre chamada, frequência e retenção.
- **Instrumentação de produto.** **NÃO ENCONTRADO** instrumentação consolidada. Sem ela,
  todas as métricas citadas neste documento são inverificáveis. **Isto deveria vir antes dos
  três itens acima.**

---

## 4. Correções pontuais de conformidade com `docs/ux-padrao.md`

Cada item é uma divergência entre o padrão escrito e o código.

| Item | Onde | Correção |
| --- | --- | --- |
| Sidebar 280px vs. 230px especificados | `Layout/styles.css` | §2.2 |
| Ação destrutiva com peso igual à neutra | `modules/alunos/pages/Listar` | §2.5 |
| Emojis 🎯 🎮 no plano de aula | `modules/aulas/pages/Chamada` | Remover — o padrão não os prevê e nenhuma outra tela os usa. Resolvido por §1.7 |
| Alvo de toque < 44px na chamada | `modules/aulas/pages/Chamada` | Resolvido por §1.7 |
| `font-size` de campo < 16px | `components/ui/Input`, `Select`, `FilterBar` | §2.6 |
| Foco de teclado ausente | todos os componentes de UI | §1.3 |
| `docs/frontend.md` declara mobile como "futuramente" | `docs/frontend.md` | Contradiz o mobile-first do resto da documentação. Corrigir o documento |
| **NÃO ENCONTRADO** `aria-live` nos toasts | componente de toast | Adicionar `role="status"` / `aria-live="polite"` |

---

## 5. Modo Aula v2 — capacidade nova

Referência visual: `Portal Professor - Modo Aula v2`, quadros `3a`, `3b`, `3c`.

Esta é a única seção que adiciona capacidade em vez de corrigir. Constrói **sobre** o que o
Portal do Professor já tem (`useCronometro`, `useWakeLock`, `useSincronizarFila`,
`estadoAula`) e nasce de **um campo** no schema, não de um módulo novo.

### 5.1 A tese

O portal hoje tem um relógio que conta para cima e um plano de aula em uma aba separada. O
professor executa o plano de cabeça e, **depois** da aula, marca em checkboxes o que fez
(`tecnicasRealizadasIds`) — uma segunda tarefa.

No v2 o plano **conduz** a aula: cada item vira um bloco com duração, o cronômetro avança
pela sequência, e o registro de execução é subproduto do timer. O dado que sai é melhor do
que o de hoje: não só "fizemos a raspagem", mas "levou 14min em vez de 12".

### 5.2 Modelo de dados — o campo que falta

**Estado atual.** O currículo existe: `curriculos` → módulos → `aulasCurriculo` →
`tecnicas`, com `jogosSugeridos` (texto livre) e `obrigatoria` (flag). Tudo consultável,
**nada temporal**.

**Alvo.** Adicionar:

1. `duracaoPrevistaSegundos: number` em cada item de `aulasCurriculo` (técnica e jogo).
2. Um tipo de bloco novo, `sparring`, com `rounds: number`, `duracaoRoundSegundos: number`,
   `descansoSegundos: number`.
3. Um tipo de bloco `pausa`, com `duracaoSegundos` e `anuncio: string` — é o que sustenta os
   comandos de voz de água e formação (§5.5).

Com isso, uma `aulaCurriculo` **compila** em uma fila de blocos:

```
aquecimento                      8 min
jogo: pega-pega de guarda        6 min
técnica: raspagem de gancho     12 min
técnica: passagem em joelho     10 min
sparring        4 rounds de 4 min, 1 min de descanso
alongamento                      5 min
                        total: 1h01
```

**Efeito colateral valioso.** O editor de currículo passa a poder avisar que o plano não
cabe na duração da turma — hoje ninguém percebe até o treino acabar atrasado.

**Aceite.** Uma `aulaCurriculo` cadastrada produz uma fila de blocos com duração total
calculada, e o editor sinaliza quando o total excede a duração da turma.

### 5.3 Ring timer

**Alvo.** Tela principal do Modo Aula, tema escuro, viewport de celular.

- Anel de progresso circular com o tempo restante do bloco em ~62px, tabular.
- Acima: etiqueta do bloco (`TÉCNICA · OBRIGATÓRIA`) e nome do bloco.
- Abaixo do anel: `Pausar/Retomar`, `+30s`, `Próx.`.
- Lista da fila de blocos abaixo, com marca de cumprido / atual / pendente e a duração de
  cada um.
- Barra fixa no pé: contador de presença (`12/18 presentes`) e `Encerrar aula`.
- Aviso sonoro configurável a N segundos do fim do bloco (padrão 10s) e na virada de round.
- Auto-avanço ao fim do bloco.
- `useWakeLock` mantém a tela ativa (já existe).
- Estado sobrevive a fechar o app, via `estadoAula` (já existe).
- Fila de sincronização por `useSincronizarFila` (já existe) — funciona offline.

**Props de configuração** (já modeladas no arquivo de design): `duracaoRound` (padrão 240s),
`roundsSparring` (4), `descansoRound` (60s), `avisoAntesFim` (10s).

**Registro automático.** Bloco cumprido grava como cumprido, com o tempo real gasto. Bloco
pulado grava como pulado. Nenhuma tela de "marcar o que foi feito" depois da aula.

**Aceite.** Uma aula completa é conduzida sem o professor tocar em nada além de `Próx.`, e o
registro de execução com tempos reais fica salvo — inclusive se o app perder a rede no meio.

### 5.4 Companion de relógio

**Alvo.** O celular fica na bolsa. No pulso: etiqueta do bloco, tempo restante, barra de
progresso e o nome do próximo bloco. Vibra nos 10 segundos finais e na virada de round.
Toque duplo avança o bloco; girar a coroa dá +30s.

**Risco declarado.** Exige app nativo. **É a única peça desta proposta que sai do stack web
atual** — tratar como fase separada, depois do PWA (§2.7).

### 5.5 Comandos de voz

**Alvo.** Skill de voz pareada a uma **arena específica**, controlando **apenas o
cronômetro**.

Comandos de fábrica:

| Gatilho falado | Resposta da Alexa | Ação no timer | Aviso final |
| --- | --- | --- | --- |
| "Alexa, pausa para água" | "Equipe, 1 minuto para água." | Bloco de pausa · 1 min | 10 s |
| "Alexa, formação" | "Atenção equipe, em 1 minuto arrumem a faixa e formação." | Bloco de pausa · 1 min | 10 s |
| "Alexa, iniciar a aula do {turma}" | "Aula do {turma} iniciada." | Iniciar cronômetro | — |
| "Alexa, próximo round" | "Round {n}, valendo." | Avançar bloco | 10 s |
| "Alexa, quanto falta?" | "Faltam {tempo} para o fim do bloco." | Só consulta | — |
| "Alexa, pausar o round" | "Cronômetro pausado." | Pausar | — |

**Bloco de pausa** é o tipo que cobre água, formação e alongamento: a Alexa anuncia, conta a
duração e avisa aos N segundos finais (padrão 10s).

**Limite deliberado — não negociável.** A lista de ações é **fechada**: `iniciar`, `pausar`,
`avancar`, `consultar`, `bloco_pausa`. **Nenhuma ação de voz toca presença, aluno ou
financeiro.** A voz nunca faz chamada, nunca marca presença e nunca fala nome de aluno.
Presença continua sendo toque na tela.

**Razão.** Voz em uma arena é um microfone permanentemente ligado perto de crianças. O
pareamento tem de ser por arena, com consentimento registrado — o módulo `consentimentos`
já suporta. É esse limite que mantém a funcionalidade defensável.

**Aceite.** Nenhum intent da Skill resolve para uma operação de escrita em presença, aluno
ou financeiro. Nenhuma resposta falada contém nome de aluno.

### 5.6 Cadastro de comandos de voz (administrador)

**Alvo.** Tela em `Configurações → Comandos de voz` no `sgcl-web`. Referência visual: `3c`.

**Quem cadastra.** Somente o administrador da conta. O professor consome no tatame e **não
edita durante a aula**. Cada comando pertence à conta e vale para todas as arenas, com
pareamento por dispositivo.

**Lista.** Tabela com: gatilho falado, resposta da Alexa, ação no timer, aviso final, e ação
de editar. Comandos de fábrica aparecem marcados como `Do sistema` e não são removíveis (a
resposta falada pode ser editada).

**Formulário de novo comando** — cinco campos:

1. `Gatilho falado` — texto. Aceita `{turma}` como variável.
2. `Resposta falada da Alexa` — texto. Aceita `{turma}`, `{n}`, `{tempo}`.
3. `Ação no timer` — **enum fechado**: `iniciar`, `pausar`, `avancar`, `consultar`,
   `bloco_pausa`.
4. `Duração do bloco` — só quando a ação é `bloco_pausa`.
5. `Aviso antes do fim` — segmentado: `Não avisar` / `10 s` / `30 s`.

Ações: `Salvar comando` e `Testar na arena 1` (dispara o anúncio no dispositivo pareado sem
alterar a aula).

**Aceite.** Um administrador cadastra "Alexa, hora do alongamento" → "Equipe, 2 minutos de
alongamento", com bloco de pausa de 2 min e aviso em 10s, e o comando funciona na arena
pareada na aula seguinte. O campo de ação não permite nenhum valor fora do enum.

### 5.7 Ordem de construção do §5

1. Campo de duração no currículo + compilação da fila de blocos (§5.2).
2. Ring timer no portal, offline pelo `useSincronizarFila` que já existe (§5.3).
3. PWA instalável (§2.7) — **pré-requisito para o resto**.
4. Cadastro de comandos de voz (§5.6) e Skill (§5.5).
5. Companion de relógio (§5.4) — exige nativo.

Os três primeiros são incrementais sobre o que já está no repositório.

---

## 6. Perguntas que bloqueiam decisões

Estas não têm resposta no código. Confirmar com o produto antes de executar a tarefa
indicada.

1. A linguagem da `landing/` pode ser a linguagem do produto? — bloqueia §0.1 e §2.1.
2. O dourado `#C9A227` aceita ficar restrito a motivo de marca? — bloqueia §1.2.
3. Existe caso de uso de chamada retroativa em desktop pela recepção? — bloqueia §1.7.
4. Quantos filhos tem o responsável típico? O desenho atual otimiza para 3+ — afeta §1.5.
5. Que percentual dos acessos ao Portal da Família vem de celular? Acima de 80%, o portal
   deve ser desenhado só para mobile — afeta §1.4 e §1.5.
6. A landing da academia é template auto-configurável ou personalizada uma a uma? — bloqueia
   §2.9.
7. Qual o tamanho de base do maior cliente hoje? — define a urgência de §2.5.
8. Existe exigência de acessibilidade contratual (licitação, convênio, escola parceira)? —
   move §1.2 e §1.3 de boa prática para bloqueador.
9. Existe analytics ativo em produção fora do que foi inspecionado? — afeta §3.
10. A próxima meta comercial é fechar os primeiros assinantes pagantes ou vender para uma
    rede multiunidade? — muda a ordem entre §1 e §2.
