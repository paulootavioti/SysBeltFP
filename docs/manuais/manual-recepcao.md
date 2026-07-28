# Manual do Usuário — Perfil Recepção

Sistema: **Sys Belt** (Sistema Faixa Preta) — gestão de academias de jiu-jítsu.

Este manual ensina, em linguagem simples, tudo o que o perfil **Recepção**
pode fazer no sistema. Ele cobre **apenas** as funções que esse perfil
realmente tem acesso — nada de telas ou botões que pertencem a outros
perfis. Sempre que uma tarefa depender de autorização do Administrador, isso
é destacado claramente.

---

## 1. Apresentação do perfil

O perfil **Recepção** é voltado para o atendimento do dia a dia da
academia: cadastro de alunos, matrículas, controle de mensalidades,
consulta de turmas e horários, campanhas de matrícula e comunicação com
alunos e responsáveis.

A Recepção **não** tem acesso ao Dashboard executivo, ao módulo Financeiro,
ao Planejamento Pedagógico (currículo de aulas) nem à área de Usuários — essas
áreas são exclusivas do Administrador. Em compensação, é o único perfil,
além do Administrador, com acesso às telas de **Relatórios**, **Mensagens**
e **Campanhas e Seminários**.

---

## 2. Responsabilidades do usuário

Como Recepção, você é responsável por:

- Cadastrar e atualizar dados de **alunos**.
- Cadastrar **responsáveis** vinculados aos alunos.
- Realizar a **matrícula** do aluno em uma turma (vínculo de aluno à turma).
- Consultar **turmas e horários** disponíveis.
- Consultar a **grade horária** de aulas (sem poder programar/iniciar aulas).
- Cadastrar e consultar **mensalidades**, e verificar pendências financeiras.
- Fazer o **atendimento** a alunos e responsáveis (dúvidas, informações).
- Inscrever alunos em **campanhas, seminários e eventos**.
- Gerar e enviar **relatórios** e **mensagens prontas** (WhatsApp) permitidos
  ao seu perfil.
- Encaminhar ao Administrador qualquer ação que exigir autorização especial
  (ver seção 6 e a lista de inconsistências ao final deste manual).

---

## 3. Como acessar o sistema

1. Abra o sistema no navegador. Você verá a tela de login, com o título
   **"Sys Belt"** e o subtítulo **"Sistema Faixa Preta"**.
2. Preencha o campo **"E-mail"** com o e-mail cadastrado.
3. Preencha o campo **"Senha"**.
4. Clique no botão **"Entrar"** (o botão muda para **"Entrando..."** enquanto
   o sistema confirma seus dados).
5. Se o e-mail ou a senha estiverem incorretos, o sistema mostra a mensagem
   **"Usuário ou senha inválidos."** — confira os dados e tente novamente.
6. Ao entrar com sucesso, você é levado direto para **"Alunos"**
   (`/alunos`), que é a tela inicial do perfil Recepção.

> Se seu usuário estiver inativo ou você não lembrar sua senha, apenas um
> Administrador pode reativar seu acesso ou recadastrar sua senha.

---

## 4. Explicação do menu e das telas disponíveis

O menu lateral da Recepção mostra os seguintes itens:

| Item do menu | Tela | O que é |
|---|---|---|
| **Arenas** | `/unidades` | Consulta aos tatames/espaços da sua unidade |
| **Alunos** | `/alunos` | Cadastro completo dos alunos (tela inicial) |
| **Turmas** | `/turmas` | Cadastro e gestão de turmas |
| **Aulas** | `/aulas` | Consulta da grade e da programação de aulas |
| **Mensalidades** | `/mensalidades` | Cadastro e consulta de cobranças dos alunos |
| **Graduações** | `/graduacoes` | Consulta ao histórico de faixas e graus |
| **Próximas Promoções** | `/graduacoes/proximas` | Consulta aos alunos elegíveis para graduar |
| **Competições** | `/competicoes` | Consulta a competições e atletas inscritos |
| **Relatórios** | `/relatorios` | Geração de relatórios em texto |
| **Planos** | `/planos` | Consulta ao catálogo de planos de pagamento |
| **Mensagens** | `/mensagens` | Textos prontos para enviar por WhatsApp |
| **Campanhas e Seminários** | `/eventos` | Cadastro e gestão de eventos/campanhas |

Você **não** verá no menu: Dashboard, Planejamento Pedagógico, Usuários,
Financeiro e Metas — esses itens são exclusivos do Administrador (e, no caso
de Planejamento Pedagógico, também do Professor).

No topo da tela, você também encontra o **sino de notificações** e, se
estiver vinculado a mais de uma unidade, o seletor **"Unidade ativa"**.

---

## 5. Passo a passo das principais tarefas

### 5.1 Cadastrar um aluno

1. Clique em **"Alunos"** (já é a tela inicial) e depois em **"+ Novo
   Aluno"**.
2. Preencha as 4 abas do formulário: **Dados Pessoais**, **Responsável**,
   **Turma** e **Saúde**.
3. Preencha ao menos **"Nome"**, **"Data de nascimento"** e **"Telefone"**
   (obrigatórios).
4. Se o aluno for menor de 18 anos, a aba Responsável passa a exigir
   **"Nome"** e **"Parentesco"** do responsável.
5. Na aba **Turma**, você já pode selecionar a turma e a forma de
   pagamento/plano — isso é o que funciona como matrícula do aluno.
6. Clique em **"Salvar"**.

### 5.2 Atualizar dados de um aluno

1. Na listagem de Alunos, clique em **"Detalhes"** do aluno desejado e
   depois em **"Editar"** — ou pesquise pelo campo **"Pesquisar aluno"**.
2. Ajuste os dados necessários nas 4 abas do formulário.
3. Clique em **"Salvar"**.

### 5.3 Cadastrar um responsável

1. Abra os **"Detalhes"** do aluno e vá na aba **"Responsáveis"**.
2. Clique em **"Novo Responsável"**.
3. Preencha **"Nome"** e **"Parentesco"** (obrigatórios), e os demais dados
   de contato, endereço e permissões (Responsável Financeiro, Pode buscar o
   aluno, Contato de emergência, Recebe comunicados).
4. Clique em **"Salvar Responsável"**.

### 5.4 Matricular um aluno em uma turma

1. Acesse **"Turmas"** e clique na turma desejada para abrir seus detalhes.
2. Se a turma estiver ativa, clique em **"+ Vincular Aluno"**, escolha o
   aluno na lista e clique em **"Vincular"**.
3. Se a turma estiver inativa, o sistema mostra o aviso "Esta turma está
   inativa — não é possível vincular novos alunos a ela." — nesse caso,
   procure o Administrador para reativar a turma.

### 5.5 Consultar turmas e horários

1. Clique em **"Turmas"** para ver a listagem completa (nome, professor,
   arena, dias, horário, vagas e status).
2. Clique em **"Aulas"** para consultar a **Grade Horária** (visão Semanal
   ou Mensal) e a aba **"Programação"**, que mostra as aulas já programadas
   por turma.

> A Recepção consegue **ver** toda a grade e a programação de aulas, mas
> **não pode programar, iniciar, editar, cancelar ou excluir** aulas — essas
> ações são de Administrador e Professor. Veja a seção 8 sobre o que
> acontece se você tentar.

### 5.6 Cadastrar e consultar mensalidades

1. Clique em **"Mensalidades"**. Use os filtros **TODAS / PENDENTE / VENCIDA
   / PAGA** e o campo **"Buscar aluno"**.
2. Para cadastrar uma nova cobrança, clique em **"+ Nova Mensalidade"**,
   escolha o aluno, o valor e a data de vencimento.
3. Clique em **"Salvar"**.

> **Marcar uma mensalidade como paga é uma ação exclusiva do
> Administrador.** Se você precisar confirmar um pagamento, registre a
> cobrança normalmente e peça para um Administrador marcá-la como paga (veja
> a seção 8).

### 5.7 Consultar planos de pagamento

1. Clique em **"Planos"** para ver o catálogo completo (nome, valor,
   periodicidade e status).
2. Cadastro, edição e ativação/inativação de planos são exclusivos do
   Administrador.

### 5.8 Consultar graduações e próximas promoções

1. Clique em **"Graduações"** para ver o histórico de trocas de faixa e
   grau, com busca por aluno.
2. Clique em **"Próximas Promoções"** para ver quais alunos já completaram
   presenças suficientes para graduar.

> **Registrar uma graduação é uma ação de Administrador e Professor**, não
> de Recepção. Se um botão "+ Registrar Graduação" aparecer para você, ele
> não vai funcionar — encaminhe ao Professor responsável ou ao
> Administrador.

### 5.9 Consultar competições

1. Clique em **"Competições"** para ver a listagem e, em **"Ver atletas"**,
   os inscritos em cada uma.

> Cadastrar competição, inscrever atleta e registrar resultado são ações de
> Administrador e Professor — não de Recepção.

### 5.10 Inscrever alunos em campanhas, seminários e eventos

1. Clique em **"Campanhas e Seminários"**.
2. Para criar um novo evento, clique em **"+ Nova Campanha/Seminário"** e
   preencha **"Título"**, **"Tipo"**, datas, **"Local"**, **"Meta de
   Participantes"** e demais dados.
3. Use os filtros de busca, tipo, status e período para localizar eventos.
4. Você pode **editar** e **excluir** eventos — essas ações estão liberadas
   para o seu perfil neste módulo.

### 5.11 Gerar relatórios permitidos

1. Clique em **"Relatórios"**.
2. Escolha entre **Financeiro**, **Ranking de Frequência**,
   **Aniversariantes do Mês**, **Evolução do Aluno** ou **Comportamental**
   (os dois últimos pedem que você selecione um aluno).
3. Clique em **"Gerar Relatório"** e depois em **"Copiar"** para enviar o
   texto por WhatsApp, e-mail ou outro canal.

### 5.12 Enviar mensagens prontas (WhatsApp)

1. Clique em **"Mensagens"**.
2. Escolha a aba: **Lembrete de Treino**, **Vencimento Próximo**,
   **Mensalidade Atrasada**, **Relatório Mensal**, **Congratulações** ou
   **Ausência**.
3. Clique em **"Abrir no WhatsApp"** (se houver telefone cadastrado) ou em
   **"Copiar texto"**.

### 5.13 Consultar arenas

1. Clique em **"Arenas"** para ver os tatames/espaços cadastrados.

> Cadastrar e editar arenas são ações exclusivas do Administrador.

---

## 6. Campos obrigatórios e regras importantes

- **Aluno**: Nome, Data de nascimento e Telefone são obrigatórios. Se o
  aluno for menor de 18 anos, Nome e Parentesco do responsável também.
- **Responsável**: Nome e Parentesco são obrigatórios.
- **Mensalidade**: Aluno, Valor e Data de Vencimento são obrigatórios.
- **Evento/Campanha**: Título, Tipo, Data de Início e Local (quando
  aplicável) — confira os campos marcados no formulário.
- **Uma turma inativa** não aceita vínculo de novos alunos — avise o
  Administrador se precisar reativá-la.
- Ações abaixo **exigem autorização do Administrador** e não podem ser
  concluídas pela Recepção, mesmo que o botão apareça na tela:
  - Marcar mensalidade como paga.
  - Registrar graduação (faixa ou grau).
  - Cadastrar/inscrever/lançar resultado em competições.
  - Cadastrar, editar ou inativar planos de pagamento.
  - Cadastrar ou editar arenas.
  - Programar, iniciar, editar, cancelar ou excluir aulas.

---

## 7. Alertas e cuidados

- **Dados de alunos e responsáveis são sensíveis** (contato, endereço,
  saúde, dados financeiros). Evite deixar telas abertas em computadores
  compartilhados com o público.
- **Confirme sempre a matrícula em turma ativa** — turmas inativas não
  aceitam novos vínculos.
- **Exclusões de responsáveis e de eventos são definitivas** — o sistema
  pede confirmação antes, mas depois não há como desfazer.
- **Antes de tentar marcar uma mensalidade como paga, registrar uma
  graduação, mexer em competições, planos ou arenas**, lembre-se de que
  essas ações pertencem ao Administrador — evita perder tempo com uma ação
  que vai retornar erro.
- **Confira sempre o telefone do responsável/aluno** antes de tentar enviar
  mensagens pelo WhatsApp — sem telefone cadastrado, o botão de envio não
  aparece.

---

## 8. Erros comuns e como resolver

| Situação | O que fazer |
|---|---|
| **"Usuário ou senha inválidos."** no login | Confira e-mail e senha. Se persistir, peça a um Administrador para conferir se seu usuário está ativo. |
| Erro ao clicar em **"✓ Marcar como Pago"** numa mensalidade | Essa ação é exclusiva do Administrador. Avise um Administrador para confirmar o pagamento. |
| Erro ao clicar em **"+ Registrar Graduação"** | Essa ação é de Administrador e Professor. Encaminhe ao professor responsável pela turma do aluno. |
| Erro ao clicar em **"+ Nova Competição"**, **"+ Inscrever Aluno"** ou **"Salvar"** (resultado) | Essas ações são de Administrador e Professor. Peça para um deles registrar. |
| Erro ao clicar em **"+ Novo Plano"**, **"Editar"** ou **"Ativar/Inativar"** em Planos | Essa ação é exclusiva do Administrador. |
| Erro ao clicar em **"+ Nova Arena"** ou **"Editar"** em Arenas | Essa ação é exclusiva do Administrador. |
| Erro ao clicar em **"+ Programar Aula"**, **"Iniciar Aula"**, **"Editar"** ou **"Cancelar"** em Aulas | Essas ações são de Administrador e Professor. Você pode consultar a grade e a programação normalmente, mas não operar nelas. |
| Erro ao tentar vincular aluno a uma turma | Confira se a turma está ativa; se estiver inativa, peça ao Administrador para reativá-la. |
| Mensagem genérica de erro ao salvar/carregar algo | Verifique sua conexão com a internet e tente novamente; se continuar, avise o suporte técnico. |

---

## 9. Boas práticas de utilização

- Confira sempre os dados de contato (telefone, WhatsApp, e-mail) ao
  cadastrar aluno e responsável — isso é essencial para as telas de
  Mensagens e Relatórios funcionarem bem.
- Ao matricular um aluno, já selecione a turma e a forma de pagamento na
  própria tela de cadastro, evitando retrabalho.
- Use os filtros de Mensalidades (PENDENTE/VENCIDA) diariamente para
  identificar pendências e encaminhá-las ao Administrador quando precisarem
  ser baixadas.
- Utilize as abas de Mensagens (Vencimento Próximo, Mensalidade Atrasada,
  Ausência) como rotina semanal de contato com os alunos.
- Ao criar uma campanha ou seminário, preencha a Meta de Participantes —
  isso permite acompanhar o progresso de inscrições.
- Sempre que um botão retornar erro, verifique primeiro se a ação é uma das
  listadas na seção 6 como exclusiva do Administrador, antes de reportar
  como problema técnico.

---

## 10. Perguntas frequentes

**Por que não vejo o Dashboard no menu?**
O Dashboard executivo é exclusivo do perfil Administrador (e Superadmin).
A Recepção acompanha os indicadores do dia a dia pelas telas de Alunos,
Mensalidades, Relatórios e Mensagens.

**Consigo marcar uma mensalidade como paga?**
Não. Essa ação é exclusiva do Administrador. Você pode cadastrar e
consultar mensalidades normalmente, mas a confirmação de pagamento precisa
ser feita por um Administrador.

**Por que apareceu um botão "+ Registrar Graduação" que não funciona para
mim?**
Esse botão hoje aparece na tela para todos os perfis com acesso a
Graduações, mas apenas Administrador e Professor conseguem realmente
registrar. Isso é uma inconsistência conhecida do sistema — encaminhe a
graduação ao professor responsável.

**Posso editar ou excluir uma turma?**
Sim, cadastro, edição e vínculo de alunos em turmas fazem parte do seu
perfil. O que você não pode é excluir uma turma (não existe exclusão de
turma no sistema, só inativação).

**Por que a tela "Arenas" às vezes é chamada de "Unidades"?**
No menu e no cabeçalho da tela, o nome usado é sempre **"Arenas"**. O termo
"Unidades" é apenas o nome técnico da rota; para você, essa tela sempre
trata de tatames/espaços físicos.

---

## 11. Glossário dos termos do sistema

- **Unidade**: cada academia/filial cadastrada no sistema.
- **Arena**: tatame ou espaço físico dentro de uma unidade, usado pelas
  turmas.
- **Turma**: grupo de alunos com professor, horário e dias fixos.
- **Matrícula**: vínculo de um aluno a uma turma (feito na tela de
  Detalhes da Turma ou já no cadastro do aluno).
- **Aula programada**: uma aula agendada para o futuro, ainda não
  iniciada.
- **Graduação**: evento de troca de faixa ou de grau de um aluno.
- **Mensalidade**: cobrança recorrente vinculada a um aluno.
- **Plano**: modelo de cobrança (valor + periodicidade) que pode ser
  associado a um aluno.
- **Inadimplência**: percentual de mensalidades vencidas e não pagas.
- **Evento (Campanha/Seminário)**: ação pontual da academia — campanha de
  matrícula, seminário, workshop etc.
- **Responsável financeiro**: responsável marcado como encarregado de pagar
  as mensalidades do aluno.
- **Perfil**: nível de acesso de um usuário (Superadmin, Admin, Professor
  ou Recepção). O seu é **Recepção**.

---

## Tabela-resumo de permissões — Recepção

| Função | Pode visualizar | Pode cadastrar | Pode editar | Pode excluir | Pode aprovar | Observações |
|---|---|---|---|---|---|---|
| Dashboard | Não | — | — | — | — | Exclusivo de Administrador/Superadmin |
| Alunos | Sim (completo) | Sim | Sim | — | — | Não existe exclusão de aluno, só inativação |
| Responsáveis | Sim | Sim | Sim | Sim | — | — |
| Turmas | Sim | Sim | Sim | — | — | Não existe exclusão de turma, só inativação |
| Aulas / Grade / Programação | Sim (só consulta) | Não | Não | Não | — | Programar, iniciar, editar e cancelar são de Admin/Professor |
| Planejamento Pedagógico | Não | — | — | — | — | Exclusivo de Administrador/Professor |
| Graduações | Sim (só consulta) | Não | — | — | — | Registrar é de Admin/Professor |
| Mensalidades | Sim | Sim | — | — | Não | Marcar como pago é exclusivo do Administrador |
| Financeiro | Não | — | — | — | — | Exclusivo do Administrador |
| Planos | Sim (só consulta) | Não | Não | — | — | Cadastro/edição são exclusivos do Administrador |
| Usuários | Não | — | — | — | — | Exclusivo do Administrador |
| Arenas | Sim (só consulta) | Não | Não | — | — | Cadastro/edição são exclusivos do Administrador |
| Competições | Sim (só consulta) | Não | Não | — | — | Cadastrar/inscrever/resultado são de Admin/Professor |
| Relatórios | Sim | — | — | — | — | Geração de texto, sem cadastro |
| Mensagens | Sim | — | — | — | — | Geração de texto pronto, sem cadastro |
| Metas | Não | — | — | — | — | Exclusivo do Administrador |
| Campanhas e Seminários | Sim | Sim | Sim | Sim | — | Único módulo além de Alunos/Turmas com CRUD completo pra Recepção |

---

## Inconsistências entre frontend e backend identificadas neste levantamento

Este manual foi escrito depois de conferir, no código do sistema, o que cada
tela mostra e o que a API realmente autoriza para cada perfil. Foram
identificadas seis situações em que a tela mostra um botão de ação para a
Recepção, mas a ação é rejeitada pela API por exigir autorização do
Administrador (ou de Administrador/Professor). Elas já estão detalhadas nas
seções 6 e 8 deste manual, e resumidas aqui:

1. **Mensalidades** — botão "✓ Marcar como Pago" visível, mas restrito ao
   Administrador.
2. **Graduações** — botão "+ Registrar Graduação" visível, mas restrito a
   Administrador e Professor.
3. **Competições** — botões "+ Nova Competição", "+ Inscrever Aluno" e
   "Salvar" (resultado) visíveis, mas restritos a Administrador e Professor.
4. **Planos** — botões "+ Novo Plano", "Editar" e "Ativar/Inativar"
   visíveis, mas restritos ao Administrador.
5. **Arenas** — botões "+ Nova Arena" e "Editar" visíveis, mas restritos ao
   Administrador.
6. **Aulas** — botões "+ Programar Aula", "Iniciar Aula", "Editar" e
   "Cancelar" visíveis na grade e na programação, mas restritos a
   Administrador e Professor.

Em todos os casos, isso **não é uma falha de segurança** — a API sempre
bloqueia a ação corretamente — mas é uma falha de experiência: o botão
aparece como se estivesse disponível, e só ao clicar é que o sistema
recusa. Se isso acontecer com você, não é erro seu: encaminhe a tarefa ao
perfil responsável, como indicado na seção 8.
