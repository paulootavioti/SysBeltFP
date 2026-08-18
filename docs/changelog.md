# Changelog

Todas as mudanças relevantes do Sys Belt - Sistema Faixa Preta serão documentadas neste arquivo.

O formato utilizado segue o conceito do **Keep a Changelog**, adaptado para o projeto.

---

# Convenções

Cada versão será dividida em:

## Adicionado

Novas funcionalidades.

## Alterado

Mudanças de comportamento.

## Melhorado

Refatorações e melhorias.

## Corrigido

Correções de bugs.

## Removido

Funcionalidades descontinuadas.

---

# 1.0.0-rc.3 — Agosto/2026

## Escopo por conta: fechando a fronteira entre assinantes

### Corrigido

- **Consulta sem unidade ativa devolvia o assinante vizinho.** `escopoUnidade(null)`
  removia o filtro de unidade — herança de quando `SUPERADMIN` existia e um banco
  continha uma academia só. Com mais de um assinante no mesmo banco (a situação
  atual, enquanto `TENANT_RESOLUTION_ENABLED` está desligado), o `DONO` de uma
  academia enxergava turmas, alunos e financeiro de outra. Agora o alcance é a
  conta de quem pergunta, resolvida uma vez na autenticação.
- **Filtros de tela sobrescreviam o escopo.** O `unidadeConsultaId` da grade
  horária e o `unidadeId` do financeiro entravam no `where` sem checagem: bastava
  passar o id de uma unidade de outra academia para ler os dados dela. Agora o
  filtro só estreita dentro do alcance; fora dele, é ignorado.
- **Listagem de alunos escapava pela junção.** `AlunoUnidade` não passava por
  `escopoUnidade`, então o escopo não atravessava a tabela de ligação.
- **Cadastro deixava criar usuário sem unidade nenhuma.** O `CreateUsuarioService`
  gravava `unidadeId` nulo sem vínculo: um usuário que não pertence a conta
  alguma, e que depois do escopo por conta entra no sistema enxergando nada, sem
  explicação na tela. Agora todo usuário precisa de pelo menos uma unidade, e só
  o `DONO` pode ficar sem unidade **ativa** (RN-164). A edição recusa rebaixar um
  `DONO` de perfil sem lhe dar unidade, que produziria o mesmo órfão.

### Alterado

- `escopoUnidade(null)` deixa de significar "sem filtro" e passa a significar "as
  unidades da conta". Sem filtro nenhum sobrou só para **rotina interna sem
  usuário** (cron de cobrança, lembretes), que precisa varrer o tenant. Havendo
  usuário autenticado sem alcance resolvido, o resultado é vazio — falha fechado.
- `resolverUnidadeConsulta` deixou de listar `SUPERADMIN`, que já não autentica
  (RN-167), e passou a receber as unidades permitidas.

### Melhorado

- RN-164 e RN-165 dizem agora que o alcance do `DONO` é aplicado como filtro, e
  que a seleção de unidade só estreita. `banco-de-dados.md` corrige a premissa de
  que o banco da consulta já seria o da academia — só será depois da separação
  física.

---

# 1.0.0-rc.2 — Agosto/2026

## Control Plane no ar, e cobertura dos portais

### Adicionado

- **Painel do operador** (`control-plane/web`): login, visão geral, listagem
  de assinantes com busca e detalhe completo — cadastro, assinatura vigente,
  ambiente, licenças por unidade, contatos, eventos de provisionamento e
  faturas. Servido pelo MESMO site da API, então as chamadas vão para `/api`
  na própria origem: sem CORS, sem variável de URL para manter em dia, e sem
  a possibilidade de o painel apontar para um Control Plane diferente do que
  o serve.
- **Publicação pelo GitHub Actions**. Duas restrições levaram a isso: os
  minutos de build do plano Free estavam esgotados, e a CLI do Netlify não
  roda em macOS anterior ao 12 (`dyld: Symbol not found:
  _SecTrustCopyCertificateChain`). O workflow compila nos runners e envia só o
  artefato — contorna as duas. Roda a suíte antes de publicar, porque a CI só
  dispara em pull request e um push direto no `main` chegaria sem verificação.
- **Testes nos dois portais**, que estavam em zero: fila offline e
  sincronização no Portal do Professor, sessão e escopo de aluno no Portal da
  Família.
- **Expiração de sessão** nos quatro frontends: um 401 do backend desloga e
  leva ao login com o aviso de que a sessão expirou. Antes, o app seguia
  "logado" com todas as telas quebradas.

### Corrigido

- A fila offline do Portal do Professor parava de esvaziar **em silêncio**
  quando a chave do `localStorage` continha algo que não fosse uma lista — as
  presenças marcadas no tatame ficavam presas no aparelho.
- O `sgcl-web` mostrava o texto da própria tela ("senha inválida") quando o
  problema era o backend fora do ar. `getApiErrorMessage` passou a distinguir
  falta de conexão de credencial recusada, e as três cópias divergentes da
  função convergiram.
- O `DONO` era barrado do Portal do Professor: a lista de perfis permitidos
  ainda citava `SUPERADMIN` e omitia `DONO`.
- O Portal da Família restaurava a seleção de um aluno que já tinha saído do
  vínculo do responsável. O backend recusava o acesso de qualquer forma, mas a
  tela pedia o que ia ser negado e quebrava sem explicação.
- O `.env` do Control Plane não era lido fora do Netlify: `dotenv` só era
  importado no `prisma.config.ts`, então `migrate deploy` enxergava o arquivo
  e o runtime não.

### Alterado

- A matriz de frontends da CI perdeu a flag `possui_testes`. Era ela que
  permitia um app novo entrar isento — foi assim que os portais ficaram
  descobertos desde que nasceram.
- O build do Control Plane virou um comando só (`npm run build:completo`),
  que instala e compila o painel junto. Rodar só `npm run build` compilava a
  API e parava aí, e a falha seguinte era ilegível: erros de tipo `'unknown'`
  em arquivos sem defeito, por cascata da tipagem que não resolvia.

---

# 1.0.0-rc — Agosto/2026

## Separação em dois planos e isolamento por academia

Marco em que o Sys Belt deixa de ser um sistema de uma academia e passa a ser
uma plataforma vendida por assinatura, com banco exclusivo por cliente.

### Adicionado

- **Control Plane** (`control-plane/`): sistema comercial B2B com banco
  próprio — assinantes, contatos, planos, assinaturas, faturas, licenças por
  unidade, operadores, auditoria, dashboard e provisionamento. 14 módulos,
  188 testes.
- **Diretório de tenants**: resolve slug → banco, autenticado backend-backend
  por segredo compartilhado com comparação em tempo constante. Devolve a
  referência do segredo no cofre, nunca a connection string.
- **Concessões assinadas (Ed25519)**: o Control Plane assina uma projeção dos
  recursos contratados; o Tenant Plane verifica localmente, sem consulta
  cruzada entre bancos em tempo de requisição.
- **Resolução de tenant por hostname**: parser de host, cache com TTL positivo
  e negativo, provider de segredos no AWS Secrets Manager e registry de
  clients Prisma com limite e expiração por ociosidade. Ativável por flag.
- **Health check de readiness** (`GET /health/tenant-resolution`), registrado
  antes da resolução para continuar diagnosticável com configuração
  incompleta, e devolvendo apenas indicadores booleanos.
- **Preflight de ativação** (`npm run tenant:preflight`) com as três fases
  configuração → habilitada → obrigatória, recusando combinações
  inconsistentes de flags.
- **Auditoria de fronteira** (`npm run tenant:auditar-fronteira`): verifica se
  o banco atual já está em condição de ser tratado como tenant único.
- **Snapshot de contagem** Tenant → Control Plane, base da cobrança por faixa.
- **Cobrança por faixa de alunos, somada por unidade**, com aluno lotado em
  mais de uma unidade contando uma vez em cada. Cálculo puro, em centavos,
  com teto por aritmética inteira.
- **Cofre de credenciais de gateway** por assinante, cifradas com AES-256-GCM.
- **Contratos versionados** entre os planos, em `contracts/`.
- Perfil **DONO**, que alcança todas as filiais da própria conta e herda as
  permissões de ADMIN.

### Alterado

- Toda a camada de dados migrou do client Prisma global para um client **por
  requisição** (`prismaDaRequisicao()`), resolvido a partir do contexto do
  tenant — 47 módulos.
- A gestão de unidades e o vínculo de usuários a unidades passaram do operador
  do SaaS para o DONO da academia.
- O build do Control Plane passou a usar `tsconfig.build.json`, que exclui
  arquivos de teste da emissão — o Netlify trata cada arquivo do diretório de
  functions como uma serverless function, e o ponto em
  `provisionar-background.test` é caractere inválido que aborta o deploy
  inteiro.

### Removido

- **Perfil `SUPERADMIN`.** O operador do SaaS passou a ter autenticação e
  banco próprios no Control Plane. Usuários com esse perfil em bancos
  anteriores são recusados no login e em toda requisição autenticada, com
  HTTP 403 — a guarda é intencional e permanece enquanto existirem bancos
  anteriores à separação.
- Rotas de administração comercial do Tenant Plane. `/plataforma` ficou com um
  único endpoint de leitura (`GET /minha-assinatura`); planos, assinantes,
  cobrança e fechamento pertencem exclusivamente ao Control Plane. Manter os
  dois lados capazes de escrever o mesmo dado comercial criaria divergência
  sem fonte da verdade.
- Telas de administração B2B do `sgcl-web`.

### Guardas

- `PrismaGlobalArquitetura.test.ts` varre `src/` e falha se qualquer arquivo
  de produção importar o Prisma global. Sem essa guarda, um único import
  esquecido reintroduziria vazamento entre academias sem que nenhum teste
  funcional acusasse.

---

# 0.1.0-alpha

## Fundação do Projeto

### Adicionado

- Estrutura inicial do backend
- Express
- Prisma ORM
- SQLite
- Organização em módulos
- API REST

---

# 0.2.0-alpha

## Autenticação

### Adicionado

- Login
- JWT
- Middleware de autenticação
- Controle de perfis

### Melhorado

- Estrutura de usuários

---

# 0.3.0-alpha

## Cadastro de Alunos

### Adicionado

- Cadastro de alunos
- Consulta
- Atualização
- Ativação/Inativação

### Melhorado

- Organização do módulo de alunos

---

# 0.4.0-alpha

## Cadastro Completo

### Adicionado

Cadastro completo contendo:

- Dados pessoais
- Contato
- Endereço
- Escola
- Saúde
- Kimono
- Foto (estrutura)
- Observações

### Melhorado

- Organização do formulário

---

# 0.5.0-alpha

## Responsáveis

### Adicionado

Cadastro de responsáveis

- Financeiro
- Emergência
- Buscar aluno
- Receber comunicados

---

## Turmas

### Adicionado

- Cadastro de turmas
- Professor
- Horários
- Faixa etária

---

# 0.6.0-alpha

## Aulas

### Adicionado

Novo modelo pedagógico baseado em aulas.

### Criado

- Aula
- AulaAluno

### Removido

Modelo antigo de Presença.

### Melhorado

Fluxo de chamada.

---

## Comportamentos

### Adicionado

Sistema comportamental.

- Respeito
- Valentia
- Esforço
- Atenção
- Disciplina

---

# 0.7.0-alpha

## Currículo

### Adicionado

- Técnicas
- Currículo pedagógico
- Organização por módulos

---

## Prontuário

### Adicionado

Novo endpoint:

GET /alunos/:id/prontuario

Retornando:

- Aluno
- Turma
- Responsáveis
- Frequência
- Evolução
- Comportamentos
- Histórico
- Financeiro
- Competições

---

## Dashboard

### Melhorado

Nova organização dos indicadores.

---

## Design System

### Adicionado

Novos componentes.

- Page
- Section
- InfoCard
- StatusBadge

---

# 0.8.0-alpha

## Graduação

### Adicionado

Início da graduação inteligente.

- Evolução por presenças
- Próximo grau
- Histórico de graduação

---

## Financeiro

### Adicionado

Início do módulo de mensalidades.

- Cadastro
- Estrutura de cobrança
- Situação financeira do aluno

---

# 0.9.0-alpha

## Segurança

### Corrigido

- Rota `POST /auth/register` deixou de ser pública; agora exige um ADMIN autenticado
- `GET /financeiro/resumo` liberado também para RECEPÇÃO (estava restrito só a ADMIN, contrariando as regras de negócio documentadas)

---

## Prontuário

### Corrigido

- Tela de prontuário (já existente) agora está acessível a partir dos detalhes do aluno

---

## Usuários

### Adicionado

- Tela de administração de usuários: cadastro, troca de perfil, ativação/inativação

---

## Competições

### Adicionado

- Cadastro de competições
- Inscrição de atletas
- Registro de resultado por atleta

---

## Relatórios

### Adicionado

- Geração de relatórios em texto: financeiro, ranking de frequência, aniversariantes do mês, evolução do aluno, comportamental
- Opção de copiar o texto gerado

---

## Dashboard

### Adicionado

- Alerta de mensalidades vencidas
- Widget de próximas graduações
- Reorganização em seções (Alunos e Atividades, Financeiro)

---

## Financeiro

### Adicionado

- Tela de caixa e inadimplência, com baixa de mensalidades vencidas direto na tela

---

## Planejamento Pedagógico

### Adicionado

- Cadastro de módulos, aulas planejadas (com objetivo e jogos sugeridos) e técnicas sugeridas dentro do currículo

---

## Graduação

### Adicionado

- Trilha de faixas Juvenil/Adulta (Branca, Azul, Roxa, Marrom, Preta), com validação de idade mínima e tempo de permanência na faixa atual antes de permitir a troca
- Formulário de graduação agora filtra as faixas disponíveis conforme a idade do aluno (trilha Infantil até Verde, trilha Juvenil/Adulta a partir de 15 anos)

---

## Turmas

### Adicionado

- Tela de gestão de turmas: cadastro, listagem, detalhe com alunos vinculados
- Vincular aluno a uma turma pela interface
- Ativar/inativar turma (endpoint que não existia)

---

## Aulas e Planejamento Pedagógico

### Adicionado

- Turma agora pode ser vinculada a um Currículo
- Ao iniciar uma aula, o professor pode escolher qual "aula do currículo" (plano de aula) está sendo aplicada
- Tela de Chamada exibe o plano de aula do dia (objetivo, jogos sugeridos, técnicas sugeridas) quando houver
- Programação prévia de aulas: agendar turma + plano de aula + data/horário com antecedência, e iniciar a aula (com chamada) diretamente a partir do agendamento
- Fluxo de "Iniciar Aula" na tela de Aulas passou a funcionar de verdade (antes era um botão sem ação)

### Alterado

- Avaliação comportamental (Respeito, Valentia, Esforço, Atenção, Disciplina) agora só é exibida e aceita para alunos de até 14 anos, alinhado com a trilha Infantil

---

## Correções gerais

### Corrigido

- Bug crítico de import que impedia o carregamento de toda a aplicação
- Relatório Comportamental lia de uma tabela que nunca era populada; agora usa os mesmos registros de presença/comportamento por aula que o Prontuário já usava

### Melhorado

- Consolidação de tipos e utilitários duplicados entre módulos (`Mensalidade`, `Responsavel`, `getApiErrorMessage`, `ApiClient`)
- Padronização visual das telas de Mensalidades e Graduações (não usavam CSS real)
- Campo `jogosSugeridos` (Planejamento Pedagógico) havia sido removido do banco por engano durante um ajuste de configuração do Prisma; restaurado

---

# Próximas versões

## 1.0.0

Primeira versão oficial.

- Sistema completo
- Produção
- Documentação finalizada
- Testes homologados

---

# Histórico de decisões importantes

## Presença → AulaAluno

O sistema deixou de registrar apenas presença.

Passou a registrar:

- presença
- comportamento
- observações
- evolução

Essa decisão tornou possível construir o prontuário completo do aluno.

---

## Currículo Pedagógico

Foi criado um módulo específico para organizar:

- técnicas
- módulos
- progressão

separando conteúdo pedagógico da execução da aula.

---

## Prontuário

O prontuário tornou-se o principal agregador de informações do sistema.

Ele passou a centralizar:

- evolução
- responsáveis
- histórico
- frequência
- financeiro
- competições

---

## 0.9.0-alpha
Fechamento de módulos pendentes e correções críticas.

- Segurança: rota de cadastro de usuário deixou de ser pública
- Prontuário: tela linkada na navegação (já existia, estava órfã)
- Usuários: tela completa de administração (cadastro, perfil, ativação)
- Competições: cadastro, inscrição de atletas e registro de resultado
- Relatórios: geração de texto (financeiro, ranking, aniversariantes, evolução, comportamental)
- Dashboard: reorganizado em seções, alertas de mensalidades vencidas, próximas graduações
- Financeiro: tela de caixa e inadimplência
- Planejamento Pedagógico: cadastro de módulos, aulas planejadas, técnicas sugeridas e jogos
- Correção de bug crítico que impedia o carregamento da aplicação
- Consolidação de código e tipos duplicados entre módulos
- Padronização visual das telas de Mensalidades e Graduações