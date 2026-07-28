# Manual do Usuário — Perfil Professor

Sistema: **Sys Belt** (Sistema Faixa Preta) — gestão de academias de jiu-jítsu.

Este manual ensina, em linguagem simples, tudo o que o perfil **Professor**
pode fazer no sistema. Ele cobre **apenas** as funções que esse perfil
realmente tem acesso — nada de telas ou botões que pertencem a outros
perfis. O sistema também **restringe alguns dados** para o Professor (por
exemplo, dados de saúde e financeiros do aluno) por serem sensíveis e não
fazerem parte da rotina de ensino — isso é explicado na seção 6.

---

## 1. Apresentação do perfil

O **Professor** é o perfil voltado para a rotina de sala/tatame: dar aulas,
fazer chamada, avaliar comportamento, planejar o conteúdo pedagógico e
registrar graduações dos alunos. Ao entrar no sistema, você já cai
diretamente na tela **"Aulas"**, que é o ponto de partida do seu dia a dia.

O Professor **não** tem acesso a Dashboard, Mensalidades, Financeiro,
Usuários, Relatórios, Mensagens, Metas, Campanhas/Seminários nem à gestão de
Arenas — essas áreas são de Administrador e/ou Recepção. Em compensação, o
Professor é o único perfil, além do Administrador, que pode **planejar o
conteúdo pedagógico** (currículo de aulas) e **registrar graduações**.

---

## 2. Responsabilidades do usuário

Como Professor, você é responsável por:

- Consultar as **turmas** em que leciona (sem poder criá-las ou editá-las).
- Consultar os **alunos** das suas turmas (com um recorte de dados básico —
  ver seção 6).
- Registrar **presença e faltas** de cada aluno em cada aula (chamada).
- **Planejar e registrar aulas**: iniciar aulas avulsas, programar aulas
  futuras (únicas ou recorrentes) e vincular um plano de aula do currículo.
- Realizar a **avaliação técnica** (marcar técnicas e jogos trabalhados) e a
  **avaliação comportamental** (Respeito, Valentia, Esforço, Atenção,
  Disciplina) dos alunos.
- Acompanhar a **evolução** de cada aluno (progresso de faixa/grau e
  histórico de graduações).
- Registrar o **conteúdo ministrado** em cada aula.
- Registrar **graduações** (troca de faixa ou grau) e consultar quais alunos
  estão **elegíveis para promoção**.
- Participar de **competições**, quando disponíveis: cadastrar competição,
  inscrever atletas e lançar resultados.
- Zelar pela responsabilidade no registro de dados dos alunos e **proteger
  as informações** às quais tem acesso, mesmo sendo um recorte básico.

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
6. Ao entrar com sucesso, você é levado direto para **"Aulas"** (`/aulas`),
   que é a tela inicial do perfil Professor.

> Se seu usuário estiver inativo ou você não lembrar sua senha, apenas um
> Administrador pode reativar seu acesso ou redefinir seus dados.

---

## 4. Explicação do menu e das telas disponíveis

O menu lateral do Professor mostra os seguintes itens:

| Item do menu | Tela | O que é |
|---|---|---|
| **Alunos** | `/alunos` | Consulta aos alunos das suas turmas (dados básicos) |
| **Turmas** | `/turmas` | Consulta às turmas (sem criar/editar) |
| **Aulas** | `/aulas` | Programação, chamada e grade horária (tela inicial) |
| **Planejamento Pedagógico** | `/planejamento` | Currículo, módulos, aulas planejadas e técnicas |
| **Graduações** | `/graduacoes` | Registro e consulta de trocas de faixa e grau |
| **Próximas Promoções** | `/graduacoes/proximas` | Alunos elegíveis para graduar |
| **Competições** | `/competicoes` | Cadastro de competições e inscrição de atletas |
| **Planos** | `/planos` | Consulta ao catálogo de planos de pagamento |

Você **não** verá no menu: Arenas, Dashboard, Mensalidades, Usuários,
Relatórios, Financeiro, Mensagens, Metas e Campanhas/Seminários — essas
áreas pertencem a outros perfis.

No topo da tela, você encontra o seletor **"Consultar grade de"** dentro da
tela de Aulas — só o Professor e o Administrador têm esse recurso, que
permite consultar (apenas para leitura) a grade horária de outra unidade em
que você também dê aula.

---

## 5. Passo a passo das principais tarefas

### 5.1 Consultar suas turmas

1. Clique em **"Turmas"** para ver a listagem (nome, faixa etária, professor,
   arena, dias, horário, vagas e status).
2. Clique em uma turma para ver seus detalhes e a lista de alunos vinculados
   (com botão **"Ver aluno"**).
3. Como Professor, você **não** vê os botões "+ Nova Turma", "Editar",
   "Inativar/Ativar" nem "+ Vincular Aluno" — essas ações são de
   Administrador e Recepção.

### 5.2 Consultar seus alunos

1. Clique em **"Alunos"**. A tabela mostra apenas **Nome, Apelido, Turma,
   Responsável** e um botão de **"Detalhes"** — não há colunas de idade,
   faixa, telefone, status ou financeiro.
2. Ao abrir os **"Detalhes"** de um aluno, você vê um resumo básico (nome,
   apelido, turma) e três abas: **Responsáveis** (só os nomes), **Presenças**
   e **Graduações**.
3. Você **não** tem o botão "+ Novo Aluno", "Editar" nem "Ver Prontuário" —
   cadastro, edição e prontuário completo são de Administrador e Recepção.

### 5.3 Dar uma aula e registrar presença (chamada)

1. Clique em **"Aulas"**. Você vê **"Aulas de Hoje"**, a **Grade Horária**
   e as abas **"Programação"** e **"Aulas e Chamadas"**.
2. Para uma aula avulsa (sem programação prévia), clique em **"+ Iniciar
   aula avulsa"** na aba "Aulas e Chamadas", escolha a turma e, se houver
   currículo vinculado, a aula planejada.
3. Para uma aula já programada, clique em **"Iniciar Aula"** (em "Aulas de
   Hoje" ou na aba "Programação") — você é levado à tela de **Chamada**.
4. Na Chamada, marque **"Presente"** para cada aluno presente.
5. Clique em **"Finalizar Aula"** ao final — depois de finalizada, a
   chamada não pode mais ser alterada.

### 5.4 Planejar e programar aulas futuras

1. Na aba **"Programação"**, clique em **"+ Programar Aula"** (ou use o
   botão **"+"** direto numa célula vazia da Grade Horária).
2. Escolha entre **"Aula única"** (uma data/horário específico) ou
   **"Recorrente"** (repete em vários dias, dentro de um período).
3. Se a turma tiver um currículo vinculado, você pode escolher a **"Aula do
   Currículo"** que será trabalhada naquele dia.
4. Clique em **"Programar Aula"** (ou **"Replicar Programação"**, no modo
   recorrente).
5. Se precisar ausentar-se de uma aula programada que é sua, use o botão
   **"Transferir"/"Trocar Substituto"** (disponível apenas para as suas
   próprias turmas), escolha o professor substituto e informe o **"Motivo do
   impedimento"** (obrigatório).
6. Você também pode **"Editar"** ou **"Cancelar"** uma aula programada
   pendente. Cancelar abre uma tela para avisar os alunos sobre o
   cancelamento. Você **não** pode **excluir** uma aula ou programação —
   essa ação é exclusiva do Administrador.

### 5.5 Avaliação técnica e comportamental

1. Na tela de **Chamada**, se a aula tiver um plano de aula vinculado, você
   vê a seção **"Plano de Aula"**, com o objetivo, os **jogos sugeridos** e
   as **técnicas sugeridas**.
2. Marque, com os checkboxes, quais jogos e técnicas realmente foram
   trabalhados naquele dia — isso registra o **conteúdo ministrado**.
3. Clique em uma técnica (badge) para ver seu detalhe (categoria e
   descrição).
4. Para alunos de **14 anos ou menos** e marcados como presentes, aparece o
   **avaliador de comportamento**, com os indicadores **Respeito,
   Valentia, Esforço, Atenção e Disciplina** — marque cada um.
5. Depois de finalizada a aula, nenhum desses campos pode mais ser alterado.

### 5.6 Acompanhar a evolução do aluno

1. Abra os **"Detalhes"** de um aluno e vá na aba **"Graduações"**.
2. Veja a barra de progresso da **Faixa Atual** e do **Grau**, calculada a
   partir do número de presenças do aluno, e o histórico completo de
   graduações anteriores.
3. Use essa aba para decidir quando um aluno está pronto para uma próxima
   avaliação de graduação.

### 5.7 Registrar uma graduação (troca de faixa ou grau)

1. Clique em **"Graduações"** e depois em **"+ Registrar Graduação"** — ou
   acesse **"Próximas Promoções"**, que já filtra os alunos elegíveis
   (aqueles que completaram um múltiplo de 8 presenças).
2. Escolha o **"Aluno"**, o **"Tipo de Graduação"** (Troca de Faixa ou
   Grau), a **"Nova Faixa"** (se aplicável, considerando a idade do aluno) e
   a **"Data da Graduação"**.
3. Você também pode marcar **"Gerar cobrança para esta graduação"** — o
   Professor pode gerar essa cobrança, mas quem confirma o recebimento do
   pagamento é sempre o Administrador.
4. Clique em **"Registrar Graduação"**.

### 5.8 Planejar o conteúdo pedagógico (Planejamento Pedagógico)

1. Clique em **"Planejamento Pedagógico"** e depois em **"+ Novo
   Currículo"**.
2. Dentro de cada currículo, adicione **Módulos** (**"+ Módulo"**), dentro
   de cada módulo adicione **Aulas Planejadas** (**"+ Aula"**) — com
   objetivo, jogos sugeridos e duração — e dentro de cada aula adicione
   **Técnicas Sugeridas** (**"+ Técnica"**), marcando se são obrigatórias ou
   opcionais.
3. Você pode editar currículos, módulos, aulas e técnicas normalmente. A
   **exclusão de um currículo inteiro**, porém, é exclusiva do
   Administrador.

### 5.9 Participar de competições

1. Clique em **"Competições"** e, se precisar cadastrar uma nova, clique em
   **"+ Nova Competição"** e informe **"Nome"**, **"Data"** e **"Local"**.
2. Clique em **"Ver atletas"** para inscrever alunos (**"+ Inscrever
   Aluno"**) e, depois da competição, registrar o **"Resultado"** de cada
   um (ex.: Ouro, Prata, Bronze).
3. Você **não** pode **excluir** uma competição — essa ação é exclusiva do
   Administrador.

### 5.10 Consultar planos de pagamento

1. Clique em **"Planos"** para consultar o catálogo (nome, valor,
   periodicidade e status).
2. Cadastro, edição e ativação/inativação de planos são exclusivos do
   Administrador — como Professor, você só consulta.

---

## 6. Campos obrigatórios e regras importantes

- **Chamada**: para registrar presença, marque o checkbox **"Presente"** de
  cada aluno antes de finalizar a aula.
- **Aula programada**: Turma é sempre obrigatória; no modo "Aula única",
  Data e Horário são obrigatórios; no modo "Recorrente", Data Inicial, Data
  Final e ao menos um dia da semana são obrigatórios.
- **Transferência de aula**: exige escolher o Professor substituto e
  informar o **"Motivo do impedimento"** — o sistema não permite transferir
  sem justificativa.
- **Graduação**: Aluno, Tipo e Data são obrigatórios; se marcar "Gerar
  cobrança", Valor e Vencimento da cobrança também passam a ser
  obrigatórios.
- **Regra de graduação por idade**: as faixas disponíveis mudam conforme a
  idade do aluno — até 14 anos usa a trilha Infantil (Branca até Verde);
  15 anos ou mais usa a trilha Juvenil/Adulta (Branca, Azul, Roxa, Marrom,
  Preta), com idade mínima e tempo de permanência exigidos para Azul, Roxa,
  Marrom e Preta.
- **Uma vez finalizada, a chamada não pode mais ser editada** — confira os
  dados de presença, técnicas e comportamento antes de clicar em
  "Finalizar Aula".
- **O Professor não visualiza dados de saúde, restrições médicas,
  alergias, medicamentos, CPF, endereço nem informações financeiras dos
  alunos.** Essas informações ficam disponíveis apenas para Administrador e
  Recepção, por serem dados sensíveis fora da rotina de ensino. Se precisar
  de alguma dessas informações (por exemplo, uma restrição médica antes de
  uma aula), solicite diretamente à Recepção ou ao Administrador.
- Ações abaixo **exigem autorização do Administrador** e não podem ser
  concluídas pelo Professor:
  - Excluir uma aula ou uma aula programada.
  - Excluir um currículo.
  - Excluir uma competição.
  - Marcar mensalidade como paga (o Professor sequer acessa Mensalidades).
  - Cadastrar, editar ou consultar Usuários, Arenas, Planos (edição) ou
    Dashboard.

---

## 7. Alertas e cuidados

- **Finalize a chamada apenas depois de conferir presença, técnicas e
  comportamento** — depois de finalizada, não é mais possível editar.
- **A transferência de aula programada só é permitida para as suas
  próprias turmas** — não é possível transferir uma aula de outro
  professor, exceto se você for Administrador.
- **Cancelar uma aula programada** avisa automaticamente a tela de aviso
  aos alunos — use-a para não deixar ninguém sem informação sobre o
  cancelamento.
- **Excluir um currículo apaga em cascata** todos os módulos, aulas
  planejadas e técnicas dele — mas essa ação é do Administrador, não sua;
  se pedir a exclusão, tenha certeza antes.
- **Dados dos alunos, mesmo no recorte básico, são sensíveis.** Evite
  deixar a tela de Alunos ou a Chamada abertas em telas visíveis a pessoas
  não autorizadas.
- **A avaliação comportamental só aparece para alunos de até 14 anos** —
  isso é uma regra do sistema, não uma falha caso não apareça para alunos
  mais velhos.

---

## 8. Erros comuns e como resolver

| Situação | O que fazer |
|---|---|
| **"Usuário ou senha inválidos."** no login | Confira e-mail e senha. Se persistir, peça a um Administrador para conferir se seu usuário está ativo. |
| Não vejo os botões de editar/cadastrar Turma | Isso é esperado — Turmas são de Administrador e Recepção; o Professor só consulta. |
| Não encontro o botão de excluir aula, programação, currículo ou competição | Essas exclusões são exclusivas do Administrador — encaminhe a solicitação a ele. |
| Não vejo o botão "Transferir" numa aula programada | Ele só aparece quando a aula é de uma turma em que você é o professor titular. |
| Não encontro dados de saúde/restrições médicas do aluno | Esses dados não são exibidos ao Professor por padrão — solicite à Recepção ou ao Administrador. |
| Não vejo os menus Dashboard, Mensalidades, Financeiro, Usuários, Relatórios, Mensagens, Metas ou Campanhas | Isso é esperado — esses módulos não pertencem ao perfil Professor. |
| A chamada não deixa mais editar presença/comportamento | A aula já foi finalizada — não é possível reabri-la pelo sistema; avise o Administrador se um dado precisar de correção. |
| Mensagem genérica de erro ao salvar/carregar algo | Verifique sua conexão com a internet e tente novamente; se continuar, avise o suporte técnico. |

---

## 9. Boas práticas de utilização

- Sempre confira o plano de aula do currículo antes de iniciar a chamada,
  para já ter os jogos e técnicas sugeridos à mão.
- Registre a chamada no mesmo dia da aula — presença, técnicas e
  comportamento ficam mais precisos assim.
- Use a aba "Próximas Promoções" com frequência para identificar alunos
  elegíveis e planejar a próxima cerimônia de graduação.
- Ao programar aulas recorrentes, revise as datas de início e fim antes de
  confirmar — o sistema avisa quantas foram criadas e quantas foram
  ignoradas por já existir programação no mesmo horário.
- Mantenha o Planejamento Pedagógico atualizado por módulo/faixa, para que
  as aulas programadas já venham com sugestão de conteúdo.
- Se identificar uma restrição médica informada verbalmente por um
  responsável, oriente-o a atualizar o cadastro junto à Recepção ou ao
  Administrador — você não tem como registrar isso diretamente.

---

## 10. Perguntas frequentes

**Por que não consigo ver o telefone ou o CPF de um aluno?**
Porque o Professor tem acesso apenas a um recorte básico dos dados do
aluno (nome, apelido, turma, responsáveis, presenças e graduações). Dados
de contato, saúde e financeiro são exclusivos de Administrador e Recepção.

**Consigo cadastrar uma turma nova?**
Não. Cadastro e edição de turmas são exclusivos de Administrador e
Recepção. Você pode apenas consultar as turmas e seus alunos vinculados.

**Por que às vezes vejo a grade horária de outra unidade?**
Porque o Professor (assim como o Administrador) pode consultar, apenas
para leitura, a grade horária de outra unidade em que também dê aula —
use o seletor **"Consultar grade de"** na tela de Aulas. Ao usar esse
seletor, os botões de programar aula ficam desabilitados (é só consulta).

**Posso excluir uma graduação registrada por engano?**
Não existe opção de editar ou excluir uma graduação já registrada no
sistema hoje. Registre com atenção e, se precisar de correção, avise o
Administrador.

**Por que não vejo a tela de Relatórios ou Mensagens?**
Esses módulos são exclusivos de Administrador e Recepção. O
acompanhamento de evolução do aluno, para o Professor, é feito pela aba
"Graduações" no cadastro do aluno.

---

## 11. Glossário dos termos do sistema

- **Turma**: grupo de alunos com professor, horário e dias fixos.
- **Aula avulsa**: aula iniciada sem programação prévia.
- **Aula programada**: uma aula agendada para o futuro, ainda não
  iniciada.
- **Chamada**: tela onde se marca presença, comportamento e conteúdo
  ministrado durante uma aula.
- **Currículo (Planejamento Pedagógico)**: conjunto de módulos, aulas
  planejadas e técnicas sugeridas para orientar o conteúdo das aulas.
- **Módulo**: divisão de um currículo, geralmente por faixa ou fase.
- **Técnica sugerida**: técnica marcada como obrigatória ou opcional dentro
  de uma aula planejada.
- **Graduação**: evento de troca de faixa ou de grau de um aluno.
- **Trilha Infantil / Juvenil-Adulta**: conjunto de faixas disponíveis
  conforme a idade do aluno.
- **Avaliação comportamental**: registro dos indicadores Respeito,
  Valentia, Esforço, Atenção e Disciplina, feito para alunos de até 14
  anos.
- **Consulta cross-unit**: possibilidade de o Professor (e o Administrador)
  visualizarem, apenas para leitura, a grade horária de outra unidade.
- **Perfil**: nível de acesso de um usuário (Superadmin, Admin, Professor
  ou Recepção). O seu é **Professor**.

---

## Tabela-resumo de permissões — Professor

| Função | Pode visualizar | Pode cadastrar | Pode editar | Pode excluir | Pode aprovar | Observações |
|---|---|---|---|---|---|---|
| Dashboard | Não | — | — | — | — | Exclusivo de Administrador/Superadmin |
| Alunos | Sim (recorte básico) | Não | Não | — | — | Sem contato, saúde ou dados financeiros |
| Turmas | Sim (só consulta) | Não | Não | — | — | Cadastro/edição são de Administrador/Recepção |
| Aulas / Chamada | Sim | Sim | Sim | Não | — | Exclusão de aula/programação é exclusiva do Administrador |
| Planejamento Pedagógico | Sim | Sim | Sim | Sim (só módulo/aula/técnica) | — | Exclusão de currículo inteiro é exclusiva do Administrador |
| Graduações | Sim | Sim | — | — | — | Não existe edição/exclusão de graduação já registrada |
| Mensalidades | Não | — | — | — | — | Exclusivo de Administrador/Recepção |
| Financeiro | Não | — | — | — | — | Exclusivo do Administrador |
| Planos | Sim (só consulta) | Não | Não | — | — | Cadastro/edição são exclusivos do Administrador |
| Usuários | Não | — | — | — | — | Exclusivo do Administrador |
| Arenas | Não | — | — | — | — | Exclusivo de Administrador/Recepção |
| Competições | Sim | Sim | Sim (resultado) | Não | — | Exclusão é exclusiva do Administrador |
| Relatórios | Não | — | — | — | — | Exclusivo de Administrador/Recepção |
| Mensagens | Não | — | — | — | — | Exclusivo de Administrador/Recepção |
| Metas | Não | — | — | — | — | Exclusivo do Administrador |
| Campanhas e Seminários | Não | — | — | — | — | Exclusivo de Administrador/Recepção |

---

## Inconsistências entre frontend e backend identificadas neste levantamento

Este manual foi escrito depois de conferir, no código do sistema, o que cada
tela mostra e o que a API realmente autoriza para cada perfil. O Professor é
afetado por uma das seis situações encontradas:

- **Planos**: o botão **"+ Novo Plano"**, **"Editar"** e
  **"Ativar/Inativar"** aparecem na tela mesmo para o Professor, mas a API
  aceita essa ação apenas do Administrador. Se você clicar nesses botões,
  vai receber um erro — isso é esperado, não é um problema do seu usuário.

As demais cinco inconsistências encontradas (Mensalidades, Graduações vistas
pela Recepção, Competições vistas pela Recepção, Arenas e Aulas vistas pela
Recepção) não afetam o Professor, porque o Professor tem autorização real
para essas ações onde elas aparecem para ele. Elas estão detalhadas nos
manuais do Administrador e da Recepção.

Em todos os casos, isso **não é uma falha de segurança** — a API sempre
bloqueia a ação corretamente — mas é uma falha de experiência: o botão
aparece como se estivesse disponível, e só ao clicar é que o sistema
recusa.
