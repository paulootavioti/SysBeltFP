# Manual do Usuário — Perfil Administrador

Sistema: **Sys Belt** (Sistema Faixa Preta) — gestão de academias de jiu-jítsu.

Este manual ensina, em linguagem simples, tudo o que o perfil **Administrador**
pode fazer no sistema. Ele foi escrito a partir das telas e regras que
realmente existem no Sys Belt hoje — nenhuma função aqui é inventada. Quando
alguma função ainda estiver incompleta, ela aparece marcada como
**"Em desenvolvimento"**.

---

## 1. Apresentação do perfil

O **Administrador** é o perfil de maior autoridade dentro de uma unidade
(academia/arena). Ele enxerga e controla praticamente tudo que acontece na
sua unidade: alunos, responsáveis, turmas, aulas, professores, recepção,
financeiro, metas, campanhas, competições e relatórios.

Existe também o perfil **Superadmin**, que fica acima do Administrador e
administra várias unidades ao mesmo tempo (criação de novas unidades/academias
franqueadas, por exemplo). Este manual é sobre o **Administrador de uma
unidade** — o perfil que a maioria das academias usa no dia a dia. Onde uma
diferença em relação ao Superadmin for relevante, ela será citada.

Em resumo: se existe uma decisão de gestão a ser tomada na academia —
cadastrar um professor, aprovar uma cobrança, decidir uma meta, excluir um
registro — ela passa pelo Administrador.

---

## 2. Responsabilidades do usuário

Como Administrador, você é responsável por:

- Acompanhar o desempenho da academia pelo **Dashboard** (receita, alunos
  ativos, frequência, inadimplência, metas).
- Cadastrar e gerenciar **usuários do sistema** (outros Administradores,
  Professores e Recepcionistas).
- Cadastrar, editar e supervisionar **alunos, responsáveis e turmas**.
- Gerenciar o **financeiro**: mensalidades, planos de pagamento, marcação de
  pagamentos e acompanhamento de inadimplência.
- Definir e acompanhar **metas estratégicas** da academia.
- Criar e gerenciar **campanhas, seminários e eventos**.
- Administrar **arenas** (tatames/espaços) usadas pelas turmas.
- Supervisionar **graduações**, **competições** e o **planejamento pedagógico**
  (currículo de aulas).
- Gerar e revisar **relatórios**.
- Ser o ponto de decisão para qualquer ação que exija autorização especial —
  o sistema bloqueia várias ações para os demais perfis justamente para que
  passem pelo Administrador.

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
6. Ao entrar com sucesso, você é levado direto para o **Dashboard**
   (`/dashboard`), que é a tela inicial do perfil Administrador.

> Se você esqueceu sua senha ou seu usuário está inativo, apenas outro
> Administrador (ou o Superadmin) pode reativar seu acesso ou redefinir seus
> dados — veja a seção 4, "Usuários".

---

## 4. Explicação do menu e das telas disponíveis

O menu lateral do Administrador mostra os seguintes itens (a ordem é a mesma
do sistema):

| Item do menu | Tela | O que é |
|---|---|---|
| **Arenas** | `/unidades` | Cadastro dos tatames/espaços físicos da sua unidade |
| **Dashboard** | `/dashboard` | Painel executivo com indicadores, metas, alertas e eventos |
| **Alunos** | `/alunos` | Cadastro completo dos alunos |
| **Turmas** | `/turmas` | Cadastro de turmas e vínculo de alunos |
| **Aulas** | `/aulas` | Programação de aulas, grade horária e chamada |
| **Planejamento Pedagógico** | `/planejamento` | Currículo, módulos, aulas planejadas e técnicas |
| **Mensalidades** | `/mensalidades` | Cobranças dos alunos |
| **Graduações** | `/graduacoes` | Histórico de trocas de faixa e grau |
| **Próximas Promoções** | `/graduacoes/proximas` | Alunos elegíveis para graduar |
| **Usuários** | `/usuarios` | Cadastro de Administradores, Professores e Recepcionistas |
| **Competições** | `/competicoes` | Cadastro de competições e inscrição de atletas |
| **Relatórios** | `/relatorios` | Geração de relatórios em texto |
| **Financeiro** | `/financeiro` | Resumo de caixa e inadimplência |
| **Planos** | `/planos` | Catálogo de planos de pagamento |
| **Mensagens** | `/mensagens` | Textos prontos para enviar por WhatsApp |
| **Metas** | `/metas` | Objetivos estratégicos da academia |
| **Campanhas e Seminários** | `/eventos` | Eventos, campanhas de matrícula e seminários |

No topo da tela (cabeçalho), você também encontra:

- **Seletor "Unidade ativa"** — só aparece se você estiver vinculado a mais
  de uma unidade; escolhe em qual unidade você está trabalhando no momento.
- **Sino de notificações** — mostra avisos do sistema.
- Seu nome de usuário, no canto superior direito.

---

## 5. Passo a passo das principais tarefas

### 5.1 Consultar o Dashboard

1. Clique em **"Dashboard"** no menu.
2. Escolha o período no seletor (Diário, Semanal, Mensal ou Anual).
3. A seção **"Visão Executiva"** mostra 8 indicadores: Receita no Período,
   Ticket Médio, Alunos Ativos, Novas Matrículas, Média de Novas Matrículas,
   Taxa de Frequência, Mensalidades Vencidas e Graduações Realizadas.
4. Role a tela para ver: **Gráficos de Desempenho**, **Metas do Período**,
   **Atenção do Gestor** (alertas), **Campanhas e Seminários**, **Próximas
   Graduações** e **Unidades e Arenas**.
5. Cada seção carrega de forma independente — se uma delas falhar ao
   carregar, aparece um botão para tentar novamente, sem travar as outras.

### 5.2 Cadastrar um aluno

1. Clique em **"Alunos"** no menu e depois em **"+ Novo Aluno"**.
2. Preencha as 4 abas do formulário: **Dados Pessoais**, **Responsável**,
   **Turma** e **Saúde**.
3. Na aba Dados Pessoais, preencha ao menos **"Nome"**, **"Data de
   nascimento"** e **"Telefone"** (campos obrigatórios).
4. Se o aluno for menor de 18 anos, a aba **Responsável** passa a exigir
   **"Nome"** e **"Parentesco"** do responsável.
5. Clique em **"Salvar"**. O sistema mostra a confirmação **"Aluno cadastrado
   com sucesso."**

### 5.3 Cadastrar uma turma

1. Clique em **"Turmas"** e depois em **"+ Nova Turma"**.
2. Preencha **"Nome da Turma"**, **"Faixa Etária"**, **"Professor"**,
   selecione ao menos um dia da semana, e os horários de início e término.
3. Opcionalmente, vincule uma **"Arena"**, um **"Currículo"** e um
   **"Limite de Alunos"**.
4. Clique em **"Cadastrar Turma"**.

### 5.4 Programar e dar uma aula

1. Clique em **"Aulas"**. Na tela, você vê primeiro **"Aulas de Hoje"**, a
   **Grade Horária** e, abaixo, as abas **"Programação"** e **"Aulas e
   Chamadas"**.
2. Para programar uma aula futura, clique em **"+ Programar Aula"** (aba
   Programação) ou clique no botão **"+"** direto numa célula vazia da grade.
   Escolha entre **"Aula única"** ou **"Recorrente"** (repete em vários dias).
3. Quando chegar a hora da aula, clique em **"Iniciar Aula"** (tanto em
   "Aulas de Hoje" quanto na aba Programação). Você é levado à tela de
   **Chamada**.
4. Na Chamada, marque **"Presente"** para cada aluno e, se a aula tiver
   plano de aula vinculado, marque os jogos e técnicas realizados.
5. Para alunos com 14 anos ou menos e presentes na aula, é possível registrar
   o comportamento do dia (Respeito, Valentia, Esforço, Atenção, Disciplina).
6. Clique em **"Finalizar Aula"** ao final.

### 5.5 Registrar uma graduação (troca de faixa ou grau)

1. Clique em **"Graduações"** e depois em **"+ Registrar Graduação"** — ou
   acesse **"Próximas Promoções"**, que já filtra os alunos elegíveis
   (aqueles que completaram um múltiplo de 8 presenças).
2. Escolha o **"Aluno"**, o **"Tipo de Graduação"** (Troca de Faixa ou Grau),
   a **"Nova Faixa"** (se aplicável) e a **"Data da Graduação"**.
3. Se quiser cobrar uma taxa de graduação, marque **"Gerar cobrança para
   esta graduação"** e informe valor e vencimento.
4. Clique em **"Registrar Graduação"**.

### 5.6 Gerenciar mensalidades e marcar pagamento

1. Clique em **"Mensalidades"**. Use os filtros **TODAS / PENDENTE / VENCIDA
   / PAGA** e o campo **"Buscar aluno"**.
2. Para cadastrar uma nova cobrança, clique em **"+ Nova Mensalidade"**,
   escolha o aluno, valor, vencimento e (opcionalmente) forma de pagamento.
3. Para marcar uma cobrança como paga, clique em **"✓ Marcar como Pago"** —
   disponível tanto na listagem quanto na tela de detalhes da mensalidade.
   **Esta ação é exclusiva do Administrador.**
4. A tela **"Financeiro"** reúne um resumo (Total Recebido, Total Pendente,
   Alunos Inadimplentes) e a lista de mensalidades vencidas, com o mesmo
   botão de marcar como pago.

### 5.7 Cadastrar planos de pagamento

1. Clique em **"Planos"** e depois em **"+ Novo Plano"**.
2. Informe **"Nome do Plano"**, **"Valor (R$)"** e **"Periodicidade"**
   (Mensal, Trimestral, Semestral ou Anual).
3. Use **"Editar"** para alterar um plano, ou **"Ativar"/"Inativar"** para
   controlar se ele continua disponível para novos alunos.

### 5.8 Cadastrar usuários (Administrador, Professor, Recepção)

1. Clique em **"Usuários"** e depois em **"+ Novo Usuário"**.
2. Preencha **"Nome"**, **"Email"**, **"Senha"** e escolha o **"Perfil"**
   (Admin, Professor ou Recepção).
3. Se o perfil escolhido for **Professor**, aparecem campos extras:
   **"Nível de graduação"** e **"Outras graduações ou habilidades"**.
4. Clique em **"Cadastrar Usuário"**.
5. Na listagem, você pode trocar o perfil de um usuário direto na coluna
   **"Perfil"** (um seletor), e inativar/ativar o acesso dele.

> Somente o **Superadmin** vê a opção de perfil **"Superadmin"** e o
> checklist para vincular um usuário a mais de uma unidade. Como
> Administrador comum, você cadastra usuários apenas dentro da sua própria
> unidade.

### 5.9 Definir e acompanhar Metas

1. Clique em **"Metas"** e depois em **"+ Nova Meta"**.
2. Escolha o **"Nome"**, o **"Tipo"** da meta (ex.: Receita, Novos Alunos,
   Redução da Inadimplência, Retenção de Alunos), o **"Valor da Meta"**, o
   **"Formato"** de exibição e a **"Data Limite"**.
3. Clique em **"Salvar"**. A meta passa a aparecer no Dashboard, com o
   progresso calculado automaticamente a partir dos dados reais da academia
   — você nunca precisa atualizar o valor atual manualmente.
4. Use **"Editar"** ou **"Excluir"** na própria tela de Metas para ajustar.

### 5.10 Criar campanhas e seminários (Eventos)

1. Clique em **"Campanhas e Seminários"** e depois em **"+ Nova Campanha/
   Seminário"**.
2. Informe **"Título"**, **"Tipo"**, **"Descrição"**, datas de início/fim,
   **"Local"**, **"Meta de Participantes"**, **"Responsável"** e, se
   quiser, **"Investimento"** e **"Receita Gerada"** estimados.
3. Acompanhe o status do evento (Rascunho, Agendado, Em Andamento, Concluído
   ou Cancelado) na listagem ou no Dashboard.

### 5.11 Administrar Arenas

1. Clique em **"Arenas"** e depois em **"+ Nova Arena"**.
2. Informe o **"Nome da Arena"** (ex.: "Tatame 1").
3. Use **"Editar"** ou **"Ativar"/"Inativar"** para manter o cadastro
   atualizado.

### 5.12 Gerar relatórios

1. Clique em **"Relatórios"**.
2. Escolha um dos cartões disponíveis: **Financeiro**, **Ranking de
   Frequência**, **Aniversariantes do Mês**, **Evolução do Aluno** ou
   **Comportamental** (os dois últimos pedem que você selecione um aluno).
3. Clique em **"Gerar Relatório"**. O texto aparece na tela.
4. Clique em **"Copiar"** para copiar o texto e enviar por WhatsApp, e-mail
   ou outro canal.

### 5.13 Enviar mensagens prontas (WhatsApp)

1. Clique em **"Mensagens"**.
2. Escolha a aba: **Lembrete de Treino**, **Vencimento Próximo**,
   **Mensalidade Atrasada**, **Relatório Mensal**, **Congratulações** ou
   **Ausência**.
3. Para cada aluno/responsável listado, clique em **"Abrir no WhatsApp"**
   (se houver telefone cadastrado) ou **"Copiar texto"**.

### 5.14 Gerenciar Planejamento Pedagógico (currículo de aulas)

1. Clique em **"Planejamento Pedagógico"** e depois em **"+ Novo
   Currículo"**.
2. Dentro de cada currículo, adicione **Módulos** (**"+ Módulo"**), dentro
   de cada módulo adicione **Aulas Planejadas** (**"+ Aula"**), e dentro de
   cada aula adicione **Técnicas Sugeridas** (**"+ Técnica"**).
3. Somente o Administrador pode **excluir** um currículo inteiro (a exclusão
   apaga também os módulos, aulas e técnicas dele).

### 5.15 Gerenciar competições

1. Clique em **"Competições"** e depois em **"+ Nova Competição"**.
2. Informe **"Nome"**, **"Data"** e **"Local"**.
3. Clique em **"Ver atletas"** para inscrever alunos (**"+ Inscrever
   Aluno"**) e, depois da competição, registrar o **"Resultado"** de cada
   atleta (ex.: Ouro, Prata, Bronze).
4. Somente o Administrador pode **excluir** uma competição.

---

## 6. Campos obrigatórios e regras importantes

- **Aluno**: Nome, Data de nascimento e Telefone são obrigatórios. Se o
  aluno for menor de 18 anos, Nome e Parentesco do responsável também.
- **Responsável**: Nome e Parentesco são obrigatórios.
- **Turma**: Nome, Faixa Etária, Professor, ao menos um dia da semana e os
  dois horários são obrigatórios.
- **Mensalidade**: Aluno, Valor e Data de Vencimento são obrigatórios.
- **Plano**: Nome, Valor e Periodicidade são obrigatórios.
- **Usuário**: Nome, Email válido, Senha (mínimo 6 caracteres na criação) e
  Perfil são obrigatórios.
- **Meta**: todos os campos do formulário são obrigatórios; o valor
  informado precisa ser maior que zero.
- **Graduação**: Aluno, Tipo e Data são obrigatórios; se marcar "Gerar
  cobrança", Valor e Vencimento da cobrança também passam a ser
  obrigatórios.
- **Regra de graduação por idade**: as faixas disponíveis mudam conforme a
  idade do aluno — até 14 anos usa a trilha Infantil (Branca até Verde);
  15 anos ou mais usa a trilha Juvenil/Adulta (Branca, Azul, Roxa, Marrom,
  Preta), com idade mínima e tempo de permanência exigidos para Azul, Roxa,
  Marrom e Preta.
- **Uma turma inativa** não aceita vínculo de novos alunos.
- **A exclusão de um currículo** apaga em cascata todos os módulos, aulas e
  técnicas dele — não é possível desfazer.

---

## 7. Alertas e cuidados

- **Exclusões são definitivas.** O sistema sempre pede confirmação antes
  de excluir (aluno, responsável, currículo, competição, aula programada
  etc.), mas depois de confirmado não há como desfazer pelo próprio
  sistema.
- **Cuidado ao trocar o perfil de um usuário** na tela de Usuários — isso
  muda imediatamente o que essa pessoa pode ver e fazer no sistema.
- **A opção "Superadmin"** só existe para quem já é Superadmin. Como
  Administrador, você nunca verá essa opção — isso é esperado, não é erro.
- **Dados de saúde e financeiros dos alunos são sensíveis.** Evite deixar a
  tela de detalhes do aluno aberta em computadores compartilhados.
- **Ao cancelar uma aula programada**, o sistema abre automaticamente uma
  tela para avisar os alunos — use-a para não deixar ninguém sem
  informação.
- **Verifique sempre o período selecionado no Dashboard** antes de tirar
  conclusões — os números mudam bastante entre Diário, Semanal, Mensal e
  Anual.

---

## 8. Erros comuns e como resolver

| Situação | O que fazer |
|---|---|
| **"Usuário ou senha inválidos."** no login | Confira e-mail e senha. Se persistir, peça a outro Administrador (ou ao Superadmin) para conferir se seu usuário está ativo. |
| Uma seção do Dashboard mostra erro ao carregar | Clique no botão de tentar novamente daquela seção — as demais seções continuam funcionando normalmente. |
| Erro ao tentar vincular aluno a uma turma inativa | Reative a turma primeiro, na tela de Turmas, antes de vincular alunos. |
| Erro "Selecione um aluno" / "Informe o valor" ao salvar | Revise os campos marcados como obrigatórios (seção 6) — o formulário não deixa salvar sem eles. |
| Erro ao excluir um currículo, competição ou usuário | Confirme se você realmente é o único perfil autorizado para aquela exclusão (algumas exclusões, mesmo para Admin, dependem de a unidade ser sua). |
| Mensagem genérica de erro ao salvar/carregar algo | Verifique sua conexão com a internet e tente novamente; se continuar, anote a tela e avise o suporte técnico. |

---

## 9. Boas práticas de utilização

- Revise o Dashboard pelo menos uma vez por semana para acompanhar receita,
  frequência e inadimplência.
- Cadastre as Metas do trimestre/ano logo no início do período, para que o
  progresso apareça corretamente desde o começo.
- Mantenha o cadastro de Planos e Arenas atualizado — eles aparecem em
  vários formulários (Aluno, Turma) como opções de seleção.
- Marque mensalidades como pagas assim que o pagamento for confirmado, para
  manter o Financeiro e os relatórios de inadimplência corretos.
- Use a aba "Relatórios" e "Mensagens" para manter contato periódico com
  alunos e responsáveis (aniversários, vencimentos, ausências).
- Antes de excluir qualquer registro, confirme que realmente não será mais
  necessário — não existe uma "lixeira" para recuperar itens excluídos.
- Ao cadastrar um novo usuário Professor ou Recepcionista, explique a ele
  quais telas ele vai (e não vai) enxergar, para evitar dúvidas — os
  manuais específicos de cada perfil ajudam nisso.

---

## 10. Perguntas frequentes

**Por que eu não vejo a opção "Superadmin" ao cadastrar um usuário?**
Porque só quem já é Superadmin pode conceder esse perfil a outra pessoa.
Isso é proposital, não é um erro do sistema.

**Por que a tela de "Arenas" às vezes é chamada de "Unidades"?**
No menu e no cabeçalho da tela, o nome usado é sempre **"Arenas"** — é o
cadastro dos tatames/espaços da sua unidade. O termo "Unidades" (rota
`/unidades`) é interno e aparece em alguns textos, mas para você, como
Administrador, essa tela sempre trata de Arenas.

**Consigo apagar uma mensalidade paga por engano?**
Não existe uma opção de excluir mensalidade no sistema hoje. Se um valor foi
lançado errado, cadastre a correção manualmente e avise o suporte técnico
se for necessário ajustar o histórico.

**Uma meta some do Dashboard se eu não atualizar o valor?**
Não — o valor atual da meta é calculado automaticamente a partir dos dados
reais (receita, alunos, frequência, inadimplência etc.), sempre que a tela
é aberta. Você não precisa (e não consegue) editar o "valor atual"
manualmente.

**Por que às vezes vejo dois seletores de unidade no topo da tela?**
Isso só acontece com o Superadmin (um seletor "Visualizando", para ver
qualquer unidade, incluindo "Todas as unidades"). Como Administrador comum,
você só vê o seletor **"Unidade ativa"**, e apenas se estiver vinculado a
mais de uma unidade.

---

## 11. Glossário dos termos do sistema

- **Unidade**: cada academia/filial cadastrada no sistema.
- **Arena**: tatame ou espaço físico dentro de uma unidade, usado pelas
  turmas.
- **Turma**: grupo de alunos com professor, horário e dias fixos.
- **Aula programada**: uma aula agendada para o futuro, ainda não
  iniciada.
- **Chamada**: tela onde se marca presença, comportamento e conteúdo
  ministrado durante uma aula.
- **Currículo (Planejamento Pedagógico)**: conjunto de módulos, aulas
  planejadas e técnicas sugeridas para orientar o conteúdo das aulas.
- **Graduação**: evento de troca de faixa ou de grau de um aluno.
- **Trilha Infantil / Juvenil-Adulta**: conjunto de faixas disponíveis
  conforme a idade do aluno.
- **Mensalidade**: cobrança recorrente vinculada a um aluno.
- **Plano**: modelo de cobrança (valor + periodicidade) que pode ser
  associado a um aluno.
- **Inadimplência**: percentual de mensalidades vencidas e não pagas.
- **Meta**: objetivo estratégico com valor-alvo e prazo, acompanhado
  automaticamente pelo sistema.
- **Evento (Campanha/Seminário)**: ação pontual da academia — campanha de
  matrícula, seminário, workshop etc.
- **Prontuário**: ficha completa do aluno (dados pessoais, saúde,
  responsáveis, frequência, comportamento e faixa).
- **Perfil**: nível de acesso de um usuário (Superadmin, Admin, Professor
  ou Recepção).
- **Ensure Role / autorização**: verificação interna do sistema que decide
  se um perfil pode ou não executar determinada ação.

---

## Tabela-resumo de permissões — Administrador

| Função | Pode visualizar | Pode cadastrar | Pode editar | Pode excluir | Pode aprovar | Observações |
|---|---|---|---|---|---|---|
| Dashboard | Sim | — | — | — | — | Tela exclusiva do Admin (e Superadmin) |
| Alunos | Sim (completo) | Sim | Sim | — | — | Não existe exclusão de aluno, só inativação |
| Responsáveis | Sim | Sim | Sim | Sim | — | Única ação de excluir é exclusiva do Admin |
| Turmas | Sim | Sim | Sim | — | — | Não existe exclusão de turma, só inativação |
| Aulas / Chamada | Sim | Sim | Sim | Sim (só aula avulsa e aula programada) | — | Exclusão de aula/programação é exclusiva do Admin |
| Planejamento Pedagógico | Sim | Sim | Sim | Sim (currículo) | — | Exclusão de currículo é exclusiva do Admin |
| Graduações | Sim | Sim | — | — | — | Não existe edição/exclusão de graduação já registrada |
| Mensalidades | Sim | Sim | — | — | Sim (marcar como pago) | Marcar como pago é exclusivo do Admin |
| Financeiro | Sim | — | — | — | Sim (marcar como pago) | Tela de resumo, com a mesma ação de pagamento |
| Planos | Sim | Sim | Sim | — | — | Inativação no lugar de exclusão |
| Usuários | Sim | Sim | Sim | — | Sim (perfil/status) | Só o Superadmin cria outro Superadmin |
| Arenas | Sim | Sim | Sim | — | — | Inativação no lugar de exclusão |
| Competições | Sim | Sim | Sim (resultado) | Sim | — | Exclusão é exclusiva do Admin |
| Relatórios | Sim | — | — | — | — | Geração de texto, sem cadastro |
| Mensagens | Sim | — | — | — | — | Geração de texto pronto, sem cadastro |
| Metas | Sim | Sim | Sim | Sim | — | Tela exclusiva do Admin |
| Campanhas e Seminários | Sim | Sim | Sim | Sim | — | — |

---

## Inconsistências entre frontend e backend identificadas neste levantamento

Este manual foi escrito depois de conferir, no código do sistema, o que cada
tela mostra e o que a API realmente autoriza para cada perfil. O
Administrador **não é afetado** por nenhuma delas (ele tem acesso total às
telas em que aparece), mas fica registrado aqui porque impacta a experiência
de Recepção e Professor, e pode gerar chamados de suporte:

1. **Mensalidades**: o botão "✓ Marcar como Pago" aparece para a Recepção
   tanto na listagem quanto nos detalhes da mensalidade, mas a API só aceita
   essa ação de um Administrador — a Recepção recebe erro ao clicar.
2. **Graduações**: o botão "+ Registrar Graduação" aparece para a Recepção,
   mas só Administrador e Professor podem de fato registrar — a Recepção
   recebe erro ao tentar salvar.
3. **Competições**: os botões "+ Nova Competição", "+ Inscrever Aluno" e
   "Salvar" (resultado) aparecem para a Recepção, mas essas ações são
   restritas a Administrador e Professor.
4. **Planos**: os botões "+ Novo Plano", "Editar" e "Ativar/Inativar"
   aparecem para Professor e Recepção, mas só o Administrador pode de fato
   usá-los.
5. **Arenas**: os botões "+ Nova Arena" e "Editar" aparecem para a Recepção,
   mas só o Administrador pode de fato usá-los.
6. **Aulas**: na aba "Programação" e no bloco "Aulas de Hoje", os botões
   "+ Programar Aula", "Iniciar Aula", "Editar" e "Cancelar" aparecem para a
   Recepção, mas essas ações exigem Administrador ou Professor — a Recepção
   consegue ver toda a grade e programação, mas não consegue operar nada
   nela.

Em todos os casos, a API sempre bloqueia corretamente a ação (não há
falha de segurança) — o problema é apenas de interface: a Recepção (e, no
caso de Planos, também o Professor) vê um botão que não pode usar e só
descobre isso depois de tentar. Recomenda-se, como melhoria futura, esconder
esses botões para os perfis que não podem usá-los.
