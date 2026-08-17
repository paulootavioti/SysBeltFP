# Regras de Negócio

Versão do documento: 3.0

Última atualização: Agosto/2026 (separação de planos, perfil DONO, assinatura da plataforma)

---

# Objetivo

Este documento descreve todas as regras de negócio do Sys Belt - Sistema Faixa Preta.

Toda implementação realizada no sistema deve obedecer às regras aqui descritas.

Caso uma regra seja alterada, este documento deverá ser atualizado antes da implementação.

---

# Filosofia do Sistema

O Sys Belt não é apenas um sistema administrativo.

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

## RN-064
A troca de faixa na trilha Juvenil/Adulta exige idade mínima por faixa: Azul e Roxa (16 anos), Marrom (18 anos), Preta (19 anos) — além dos 4 graus.

---

## RN-065
A troca de faixa na trilha Juvenil/Adulta também exige tempo mínimo de permanência na faixa atual: aproximadamente 2 anos para Azul e Roxa, 1 ano e meio na faixa Roxa antes da Marrom.

---

## RN-066

A avaliação comportamental (Respeito, Valentia, Esforço, Atenção, Disciplina) é aplicável somente a alunos com até 14 anos (trilha Infantil).

---

# Faixas

O sistema utiliza duas trilhas de faixa, conforme a categoria do aluno.

## Trilha Infantil (Kids e Teens, até 14 anos)

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

## Trilha Juvenil/Adulta (a partir de 15 anos)

Branca (sem idade mínima)
Azul (mínimo 16 anos)
Roxa (mínimo 16 anos)
Marrom (mínimo 18 anos)
Preta (mínimo 19 anos)

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

DONO

ADMIN

PROFESSOR

RECEPCAO

Detalhamento completo de cada perfil nas seções "Unidades e Arenas" e "Perfis e Permissões" abaixo.

---

# Unidades e Arenas

O isolamento acontece em dois níveis diferentes.

**Entre academias assinantes:** cada academia opera sobre um banco de dados
exclusivo. Nenhuma consulta alcança dados de outra academia porque não há
banco compartilhado entre elas.

**Entre unidades da mesma academia:** cada Unidade (filial) tem seus dados
escopados por `unidadeId`, mas as unidades da mesma academia **compartilham
dados entre si** — um aluno pode treinar em mais de uma filial da rede.

## RN-160

Toda entidade operacional (Aluno, Turma, Aula, Mensalidade, Graduação, Competição, Currículo, Técnica, Plano, Usuário, etc.) pertence a exatamente uma Unidade, exceto o usuário `DONO`, que alcança todas as filiais da própria conta.

---

## RN-161

Uma Unidade possui uma ou mais Arenas.

Arena representa qualquer sala, tatame ou área física usada para ministrar aulas.

---

## RN-162

Uma Turma pode ser vinculada a uma Arena. Duas turmas não podem ocupar a mesma Arena no mesmo dia da semana e horário sobreposto (checagem de conflito de horário).

---

## RN-163

O mesmo professor não pode ser escalado em duas turmas com dia/horário sobrepostos, salvo pela transferência de aula (ver seção "Transferência de Aula").

---

## RN-164

Um usuário `DONO` não é fixado a uma unidade (`unidadeId` nulo) e alcança todas as filiais da própria conta — e nenhuma de outra academia.

---

## RN-165

O `DONO` pode alternar entre uma unidade específica e "todas as unidades" da própria conta, através de um seletor. Essa escolha filtra o sistema inteiro (Alunos, Turmas, Financeiro, Aulas, Usuários etc.) enquanto durar a seleção, sem alterar nenhum dado.

---

## RN-166

Cadastram, editam e ativam/inativam Unidades os perfis `DONO` e `ADMIN`. As unidades criadas pertencem sempre à conta de quem as cria.

---

## RN-167 — Operador da plataforma

O operador do SaaS **não é um perfil do sistema da academia**. Ele trabalha no
Control Plane, com autenticação própria e banco próprio.

O perfil `SUPERADMIN`, que antes acumulava a operação do SaaS com a
administração da academia, foi removido. Usuários com esse perfil em bancos
anteriores à separação dos planos são recusados no login e em toda requisição
autenticada, com HTTP 403.

A regra existe porque acumular os dois papéis num único perfil significava que
o mesmo login que administrava uma academia podia alcançar dados comerciais de
todas — exatamente o que a separação de planos elimina.

---

# Perfis e Permissões

## RN-170 — DONO

O dono da academia cliente. Alcança todas as filiais da própria conta e
nenhuma de outra. Onde um `ADMIN` passa, ele passa — a herança é declarada uma
única vez em `PERFIS_QUE_HERDAM`, para que nenhuma rota precise lembrar de
listar os dois. Pode:

- Cadastrar, editar e ativar/inativar Unidades da própria conta.
- Vincular um usuário (Admin, Professor ou Recepção) a mais de uma Unidade da própria conta.
- Consultar a própria assinatura (`GET /plataforma/minha-assinatura`): plano vigente, contagem de alunos por unidade, prévia do mês e histórico de faturas.

Uma lista de unidades que misture contas diferentes é recusada inteira, em vez
de ter as unidades inválidas silenciosamente descartadas — descartar em
silêncio esconderia um vínculo que o usuário acredita ter criado.

---

## RN-171 — ADMIN

Acesso restrito à(s) própria(s) unidade(s) — pode estar vinculado a mais de uma (ver "Usuário Multi-Unidade"). Tem acesso de consulta (somente leitura) à grade horária de outras unidades, para efeito informativo. Pode:

- Gerir as Arenas da própria unidade.
- Cadastrar usuários Professor e Recepção para a própria unidade.
- Gerir tudo o mais relativo à própria unidade (Alunos, Turmas, Aulas, Financeiro, Relatórios, Mensagens, Usuários etc.).

---

## RN-172 — PROFESSOR

Não está necessariamente vinculado a uma única unidade — pode dar aula em mais de uma unidade/arena, em horários diferentes (ver "Usuário Multi-Unidade"). Tem acesso de consulta (somente leitura) à grade horária de todas as unidades. Pode:

- Ter acesso total às próprias aulas agendadas e consultar as aulas de outros professores.
- Agendar e programar aulas, e iniciar uma aula avulsa para si mesmo.
- Transferir uma aula programada para outro professor quando estiver impedido de ministrá-la (ver "Transferência de Aula").
- Cadastrar e consultar planejamento pedagógico.
- Consultar e registrar graduações.
- Acessar e registrar a tela de Competições.
- Consultar a tela de Turmas (sem criar/editar turma, vincular aluno ou alterar status — essas ações são exclusivas de ADMIN/RECEPCAO).
- Consultar a tela de Planos.

Restrição de dados do Aluno — o Professor só enxerga:

- Nome
- Apelido
- Nome do(s) Responsável(is)
- Turma
- Presenças
- Graduações

Nenhum outro campo do Aluno (CPF, endereço, contato, dados de saúde, financeiro, comportamentos, prontuário completo) é exposto ao Professor pelo backend — não é apenas uma questão de UI, os endpoints retornam um payload reduzido para esse perfil.

O Professor não tem acesso às telas de Relatórios, Mensagens, nem Unidades/Arenas.

---

## RN-173 — RECEPCAO

Acesso restrito à própria unidade. Telas disponíveis:

- Alunos
- Turmas
- Aulas
- Mensalidades
- Graduações / Próximas Graduações
- Competições
- Planos
- Mensagens
- Relatórios

Sem acesso a Planejamento Pedagógico nem a Financeiro (essas duas telas são exclusivas de ADMIN e PROFESSOR/ADMIN respectivamente).

---

## RN-174

Os usuários Admin e Recepção podem ser cadastrados pelo Dono em uma ou mais unidades da conta. O usuário Professor também pode ser vinculado a mais de uma unidade, já que pode dar aula em unidades/arenas diferentes.

---

# Transferência de Aula

## RN-180

Quando o professor titular de uma turma está impedido de ministrar uma aula programada específica, é possível transferi-la para outro professor da mesma unidade, sem alterar o professor titular da turma em si — a transferência vale só para aquela ocorrência.

---

## RN-181

Toda transferência exige um motivo (justificativa do impedimento) obrigatório e não vazio.

---

## RN-182

Só é possível transferir uma programação com status PENDENTE (não iniciada, não cancelada).

---

## RN-183

O professor substituto precisa ser diferente do professor titular, pertencer à mesma unidade, estar ativo e ter perfil PROFESSOR.

---

## RN-184

A transferência é bloqueada se o professor substituto já estiver escalado (como titular ou como substituto de outra transferência) em outra turma no mesmo dia/horário.

---

## RN-185

Um ADMIN pode transferir qualquer aula programada da própria unidade; um PROFESSOR só pode transferir aulas das turmas em que é o professor titular.

---

# Usuário Multi-Unidade

## RN-190

Um usuário Admin, Professor ou Recepção pode estar vinculado a mais de uma Unidade (tabela `UsuarioUnidade`) — quem monta essa lista é o Dono (ou um Admin), através de um checklist no cadastro/edição do usuário, sempre restrito às unidades da própria conta.

---

## RN-191

Todo usuário vinculado a unidade(s) possui uma "unidade ativa" (`Usuario.unidadeId`) — a unidade em cujo contexto ele está operando no momento. Para quem só tem uma unidade vinculada, a ativa é sempre a mesma.

---

## RN-192

Um usuário vinculado a mais de uma unidade pode trocar sua unidade ativa a qualquer momento através de um seletor no cabeçalho, restrito às unidades às quais ele de fato está vinculado.

---

## RN-193

Se a unidade ativa de um usuário for removida da lista de unidades vinculadas, uma nova unidade ativa é escolhida automaticamente entre as remanescentes.

---

## RN-194

Ao promover um usuário a DONO, sua unidade ativa é liberada — o Dono não é fixado a uma unidade específica, pois alcança todas as filiais da própria conta.

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

# Assinatura da plataforma

Regras do modelo comercial do SysBelt. Elas pertencem ao Control Plane; o
sistema da academia apenas **lê** a própria assinatura.

## RN-200 — Cobrança por faixa de alunos

Cada faixa cobre até 10 alunos e custa R$ 37,00.

---

## RN-201 — Faixa contada por unidade

O valor da conta é a soma das faixas de cada unidade, calculadas
individualmente — não sobre o total da academia. Toda unidade ativa custa no
mínimo uma faixa.

Uma academia com 12 alunos numa unidade e 8 em outra paga
`2 + 1 = 3 faixas = R$ 111,00`. Se a contagem fosse feita sobre o total (20
alunos), o resultado seria 2 faixas — a regra é deliberadamente por unidade.

---

## RN-202 — Aluno em mais de uma unidade

Um aluno lotado em mais de uma unidade da mesma academia **conta uma vez em
cada unidade** onde está lotado.

Quando um aluno solicita treinar numa turma de outra unidade, a contagem de
faixas é refeita e os dados passam a ser compartilhados entre as unidades
envolvidas.

---

## RN-203 — Arredondamento sempre para cima, em aritmética inteira

O número de faixas é o teto da divisão, calculado com aritmética inteira
(`floor((alunos + porFaixa - 1) / porFaixa)`), não com `Math.ceil` sobre
divisão em ponto flutuante.

Dividir em ponto flutuante pode devolver uma faixa a mais quando a divisão não
é exata em binário — e uma faixa a mais é dinheiro cobrado a mais do cliente.

---

## RN-204 — Valores em centavos

Todo valor do domínio da plataforma é inteiro em centavos. Os montantes são
reconciliados com gateways de pagamento, onde deriva de ponto flutuante é
inaceitável.

---

## RN-205 — Preço negociado prevalece sobre o de tabela

Uma assinatura pode ter `precoPorBlocoCentavos` próprio. Quando existe, é ele
que vale para aquela conta, e é ele que aparece na tela do dono — não o preço
de tabela do plano.

---

## RN-206 — A prévia do mês é calculada, não lida

`GET /plataforma/minha-assinatura` calcula a prévia na hora, a partir da
contagem atual de alunos, em vez de ler a última fatura. É o que permite
responder "se eu matricular mais 3 alunos, muda meu preço?".

---

## RN-207 — Recursos liberados por concessão assinada

Recursos opcionais (por exemplo, WhatsApp) são liberados por uma **concessão
assinada** com chave Ed25519 emitida pelo Control Plane e verificada
localmente pelo Tenant Plane.

Sem concessão válida, o recurso é negado — falha fechada. Uma concessão
adulterada falha na verificação da assinatura, em vez de conceder acesso.

---

# Integrações Futuras

Aplicativo Mobile

Inteligência Artificial para planejamento de aulas

Inteligência Artificial para evolução técnica

Relatórios em PDF e Excel

Ranking, medalhas e estatísticas de competições

Certificados automáticos de graduação

> WhatsApp, PIX, Portal da Família e Portal do Professor constavam nesta lista
> em versões anteriores e já estão implementados.

---

# Princípios

O Sys Belt foi desenvolvido considerando que o objetivo principal da academia não é apenas ensinar técnicas de Jiu-Jitsu, mas formar pessoas.

Por isso, todas as regras do sistema procuram refletir tanto a evolução técnica quanto o desenvolvimento humano do aluno.

Toda nova funcionalidade deverá respeitar esses princípios.