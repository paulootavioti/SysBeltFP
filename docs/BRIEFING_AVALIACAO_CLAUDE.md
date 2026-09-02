# Briefing para avaliacao externa do Sys Belt

## Papel esperado

Atue como engenheiro de software senior, arquiteto de produto e especialista
em UX/UI para SaaS B2B. Avalie o **Sys Belt (SysBeltFP)** com foco em:

1. arquitetura, seguranca, qualidade e capacidade de evolucao;
2. cobertura funcional e consistencia entre modulos;
3. experiencia do dono, recepcao, professor, aluno e responsavel;
4. qualidade visual, responsividade, acessibilidade e clareza dos fluxos;
5. competitividade diante dos melhores sistemas de gestao para academias.

Nao presuma que uma funcionalidade esta pronta apenas porque existe um model,
endpoint ou componente. Diferencie: **implementado e utilizavel**, **parcial**,
**somente infraestrutura**, **legado** e **nao encontrado**.

## Produto

O Sys Belt e um SaaS brasileiro de gestao administrativa e pedagogica para
academias de artes marciais, principalmente jiu-jitsu, judo e karate. O
publico principal e o dono de academia pequena ou media, normalmente com 3 a
80 alunos e sem equipe de TI.

Proposta central:

- organizar alunos, responsaveis, turmas e unidades;
- registrar chamada, comportamento, frequencia e graduacoes;
- estruturar curriculo tecnico por faixa e faixa etaria;
- controlar planos, contratos, mensalidades, Pix e cartao recorrente;
- oferecer portais dedicados para familia e professor;
- captar e acompanhar leads;
- automatizar comunicacao e rotinas de retencao.

## Regra obrigatoria de multi-tenancy

O banco PostgreSQL operacional e compartilhado entre todos os assinantes.

    Banco compartilhado
      Conta A
        Unidade A1
        Unidade A2
      Conta B
        Unidade B1

- Conta e a fronteira do tenant/assinante.
- Unidade representa uma filial.
- Nenhum assinante pode ler, alterar, inferir ou exportar dados de outro.
- O dono pode acessar todas as unidades da propria conta.
- Outros perfis acessam apenas as unidades autorizadas.
- O isolamento atual e aplicado na aplicacao; PostgreSQL RLS nao esta ativo.

Analise com atencao qualquer consulta por ID, agregacao, job, webhook, cache,
arquivo ou importacao que possa escapar dessa fronteira.

## Aplicacoes e ambientes

| Diretorio | Ambiente | Tecnologia |
| --- | --- | --- |
| src/ e prisma/ | API operacional | Node.js, Express 5, TypeScript, Prisma 6, PostgreSQL |
| sgcl-web/ | Ambiente administrativo | React, Vite, TypeScript |
| sgcl-portal-familia/ | Portal da Familia | React, Vite, TypeScript |
| sgcl-portal-professor/ | Portal do Professor | React, Vite, TypeScript |
| control-plane/ | Gestao comercial e de tenants | API Node/Prisma + React/Vite |
| landing/ | Landing Page do Sys Belt | HTML, CSS e JavaScript estaticos |
| landing-academia/ | Landing/captacao da academia | HTML, CSS e JavaScript estaticos |

Deploys e CI usam Netlify e GitHub Actions. Ha typecheck, testes, lint e build
para API, Control Plane e frontends.

## Modulos existentes

### Operacao da academia

- contas, unidades, arenas e modalidades;
- usuarios e acesso por perfil;
- alunos, responsaveis e prontuario;
- turmas, professores e aulas;
- chamada, presenca, comportamento e frequencia;
- faixas, graus e graduacoes;
- curriculo, modulos, aulas planejadas e tecnicas;
- competicoes, eventos, metas e relatorios;
- fotos de treino e autorizacoes.

### Financeiro

- planos comerciais da academia;
- assinaturas recorrentes dos alunos;
- mensalidades e formas de pagamento;
- contratos e assinatura eletronica;
- Pix e cartao recorrente via Mercado Pago;
- webhook, idempotencia, retentativa e conciliacao;
- loja, produtos, estoque e pedidos.

Importante: ha dois dominios financeiros distintos:

- Plano, Assinatura e Mensalidade: valores pagos pelos alunos;
- PlanoPlataforma, AssinaturaPlataforma e FaturaPlataforma: valores pagos
  pela academia ao Sys Belt.

### Relacionamento e aquisicao

- leads, etapas do funil e timeline;
- landing publica de captacao;
- conversao de lead em aluno;
- WhatsApp e Instagram/Meta;
- bot de qualificacao;
- conversas, templates e estados de entrega;
- regua de cobranca, lembrete de aula e avisos de acesso.

### Portais

- Portal da Familia para aluno/responsavel;
- Portal do Professor para chamada e operacao pedagogica;
- recuperacao de senha;
- documentos, contratos, mensalidades, pedidos e conta da familia.

### Seguranca e conformidade

- JWT, rate limit, redefinicao de senha e 2FA;
- perfis DONO, ADMIN, PROFESSOR e RECEPCAO;
- consentimentos para dados, imagem, biometria, saude e comunicacoes;
- versao do texto aceito, responsavel, IP, dispositivo e revogacao;
- logs de auditoria e requestId;
- cofre/referencias de segredos para integracoes.

## Estado competitivo e decisoes de negocio

Vantagens pretendidas:

- curriculo e planejamento pedagogico por faixa e idade;
- Portal da Familia;
- plano gratuito permanente ate 3 alunos;
- modulo de RH;
- operacao multiunidade;
- funil e captacao integrados.

Lacunas ou frentes ainda em consolidacao:

1. teto de aproximadamente R$ 149 por unidade na cobranca do Sys Belt,
   mantendo alunos ilimitados acima de quatro faixas;
2. transformar os portais em PWAs instalaveis;
3. oferecer check-in do aluno com prevencao de fraude;
4. concluir cartao recorrente e recuperacao de falhas;
5. ampliar automacoes de retencao;
6. transformar a importacao em migracao assistida;
7. instrumentar ativacao, retencao e uso dos modulos.

## Descobertas anteriores a verificar

Estas sao hipoteses baseadas em auditoria anterior, nao conclusoes imutaveis:

- precificacao duplicada no backend, Control Plane e landing;
- landing distribui alunos igualmente entre unidades, enquanto o faturamento
  usa lotacao real de cada filial;
- controle de acesso possui consultas globais de credenciais que podem nao
  restringir dispositivo/unidade;
- importacao CSV grava linha por linha, sem previa, lote atomico,
  deduplicacao ou desfazer;
- existe infraestrutura de Pix, cartao, webhook e conciliacao, mas o ciclo de
  falha e recuperacao precisa ser validado;
- existem regua de inadimplencia e lembrete, mas nao um motor completo;
- nao foram encontrados manifest, service worker, push ou offline nos portais;
- nao foi encontrada instrumentacao consolidada de produto;
- nao foram encontrados fluxos completos de portabilidade, anonimizacao,
  retencao e eliminacao de dados;
- o isolamento multitenant depende de filtros da aplicacao e nao de RLS.

## Direcao visual atual

A Landing Page Sys Belt usa identidade preto, dourado e creme, tipografia
Archivo, reguas de 2px, superficies sem arredondamento e telas reais do
produto. A composicao e editorial e objetiva.

Secoes atuais: hero, beneficios, dores, modulos, prontuario, planejamento,
Portal da Familia, multiunidades, comparativo, calculadora de preco,
confianca/LGPD/Pix/RH, formulario e rodape.

Avalie se a landing:

- comunica o produto nos primeiros segundos;
- parece confiavel para quem fornecera dados de menores;
- demonstra valor com telas reais;
- sustenta as alegacoes comerciais;
- apresenta preco sem ambiguidade;
- conduz claramente ao cadastro ou contato;
- funciona bem em desktop e mobile;
- possui contraste, foco, hierarquia e alvos de toque adequados.

Nos ambientes operacionais, avalie:

- consistencia entre menus, nomenclaturas e componentes;
- clareza da unidade ativa;
- densidade apropriada para uso diario;
- prevencao de erro em acoes financeiras e cadastros;
- estados vazios, carregamento, erro e sucesso;
- acessibilidade por teclado e leitor de tela;
- responsividade de tabelas, modais, formularios e chamadas;
- diferenca real entre dono, recepcao e professor.

## Evidencias prioritarias

- prisma/schema.prisma
- src/app.ts
- src/shared/middlewares/ensureAuthenticated.ts
- src/shared/utils/escopoUnidade.ts
- src/modules/plataforma/utils/precoPlataforma.ts
- src/modules/pagamentos/
- src/modules/controleAcesso/
- src/modules/consentimentos/
- src/modules/alunos/services/ImportarAlunosCsvService.ts
- src/modules/whatsapp/
- sgcl-web/src/shared/constants/acessoPorPerfil.ts
- sgcl-web/src/shared/constants/navegacao.ts
- sgcl-web/src/modules/
- sgcl-portal-familia/src/
- sgcl-portal-professor/src/
- landing/
- landing-academia/
- control-plane/
- .github/workflows/ci.yml
- docs/arquitetura-multitenant.md
- docs/percurso-funcional.md

## Entregaveis solicitados

Produza a avaliacao em portugues do Brasil, com caminhos reais como evidencia
e sem escrever codigo nesta rodada.

### 1. Resumo executivo

- maturidade geral;
- cinco forcas;
- cinco riscos;
- bloqueadores para comercializacao.

### 2. Auditoria modulo a modulo

Para cada modulo, informe finalidade, funcionalidades encontradas, estado
real, problemas de negocio, riscos de seguranca/multi-tenancy, problemas de
UX/UI, testes existentes/ausentes e prioridade.

### 3. Avaliacao de design

Analise separadamente Landing Sys Belt, Landing da Academia, Administrativo,
Portal da Familia, Portal do Professor e Control Plane. Use notas de 0 a 10
para clareza, consistencia, acessibilidade, responsividade, confianca e
eficiencia. Justifique com evidencias, sem generalidades.

### 4. Jornadas ponta a ponta

Simule pelo codigo:

1. contratacao e criacao do tenant;
2. criacao de unidade, arena e turma;
3. importacao/cadastro de aluno e responsavel;
4. plano, contrato e mensalidade;
5. primeira aula e chamada;
6. acesso da familia;
7. cobranca por Pix e cartao;
8. captacao e conversao de lead;
9. operacao multiunidade;
10. cancelamento, exportacao ou exclusao de dados.

Registre onde cada jornada quebra, depende de integracao externa ou nao
possui feedback adequado.

### 5. Recomendacoes

Organize em tres ondas: agora (seguranca, receita, venda), proximo trimestre
(ativacao, retencao, eficiencia) e depois (expansao e diferenciacao). Para
cada item, apresente impacto, esforco, dependencias, risco e metrica.

### 6. Perguntas finais

Termine com no maximo dez perguntas que removam incertezas relevantes.

## Restricoes

- O codigo e a fonte de verdade.
- Escreva "nao encontrei" quando nao houver evidencia.
- Marque explicitamente qualquer suposicao.
- Nao exponha valores de arquivos .env, tokens ou dados pessoais.
- Nao recomende reescrita total sem provar que evolucao incremental e inviavel.
- Nao confunda infraestrutura existente com experiencia finalizada.
- Nao considere comentarios como prova sem conferir implementacao e testes.
