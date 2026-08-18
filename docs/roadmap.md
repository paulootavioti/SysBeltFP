# Sys Belt — Roadmap

> Documento de planejamento estratégico

Versão do documento: 3.0

Última atualização: Agosto/2026

---

# Visão

O Sys Belt é uma plataforma SaaS de gestão para academias de artes marciais,
vendida por assinatura mensal e cobrada por faixa de alunos.

Cada academia assinante opera sobre um **banco de dados exclusivo**. Não há
tabela compartilhada entre clientes, não há coluna `clienteId` separando
registros de academias diferentes no mesmo banco, e nenhuma consulta do
sistema operacional pode alcançar dados de outro assinante — o isolamento é
físico, não lógico. A decisão está registrada em
[`architecture-decisions.md`](architecture-decisions.md), ADR-010.

O produto une, numa única plataforma:

- gestão administrativa (alunos, responsáveis, turmas, unidades, arenas);
- gestão pedagógica (currículo, planejamento, evolução técnica, graduações);
- gestão esportiva (competições);
- gestão financeira (mensalidades, planos, pagamentos, contratos);
- comunicação (avisos, mensagens, WhatsApp, Portal da Família).

---

# Modelo comercial

A assinatura é cobrada **por unidade**, em faixas de alunos:

- cada faixa cobre até 10 alunos e custa R$ 37,00;
- o valor da conta é a soma das faixas de cada unidade, com mínimo de uma
  faixa por unidade ativa;
- um aluno que treina em mais de uma unidade da mesma academia **conta uma
  vez em cada unidade** onde está lotado.

Uma academia com duas unidades — 12 alunos numa, 8 na outra — paga
`2 faixas + 1 faixa = 3 × R$ 37,00 = R$ 111,00`. As unidades da mesma
academia compartilham dados entre si; academias diferentes, nunca.

O cálculo vive em `src/modules/plataforma/utils/precoPlataforma.ts` e usa
aritmética inteira em centavos. Ele não lê banco nem relógio, o que o torna
testável isoladamente e imune a arredondamento de ponto flutuante — uma faixa
a mais é dinheiro cobrado a mais.

---

# Arquitetura em dois planos

O sistema é dividido em dois planos com bancos separados e responsabilidades
que não se sobrepõem.

## Control Plane (`control-plane/`)

O sistema comercial do SysBelt. Guarda assinantes, planos, assinaturas,
faturas, licenças por unidade, operadores, auditoria e o inventário de
provisionamento. É onde o operador do SaaS trabalha.

Também é a autoridade do **diretório de tenants**: dado um slug, responde qual
banco atende aquela academia — sem nunca devolver a connection string, apenas
a referência do segredo no cofre.

14 módulos, 188 testes, mais o painel do operador (`control-plane/web`) com
50 testes.

## Tenant Plane (`src/`)

O sistema que a academia usa. Não conhece preço, fatura nem outro assinante.
O que ele sabe sobre a própria assinatura chega por uma **concessão assinada**
(Ed25519): o Control Plane assina uma projeção com os recursos contratados, e
o Tenant Plane verifica a assinatura localmente. Os dois bancos permanecem
desacoplados — não há consulta cruzada em tempo de requisição.

44 módulos, 663 testes.

## Contratos

Os formatos trocados entre os planos estão versionados em `contracts/`:

```
contracts/
├── control-plane-provisioner/   # Control Plane → provisionador
├── control-plane-tenant/        # Control Plane → Tenant (concessão)
└── tenant-control-plane/        # Tenant → Control Plane (snapshot de contagem)
```

---

# Estado atual

Versão: **1.0.0-rc** — Tenant Plane em produção com uma academia real;
Control Plane publicado, com painel de operador, aguardando o primeiro
assinante provisionado.

## Concluído

### Produto operacional (Tenant Plane)

| Área | Situação |
|---|---|
| Alunos, responsáveis, turmas, arenas, unidades | Completo |
| Aulas, chamada, programação, transferência entre professores | Completo |
| Currículo, técnicas, planejamento, prontuário | Completo |
| Graduações (trilha Infantil e Juvenil/Adulta) | Completo |
| Comportamentos | Completo |
| Mensalidades, planos, financeiro, caixa, inadimplência | Completo |
| Pagamentos com gateway (PIX/cartão) e credenciais por assinante | Completo |
| Contratos, modelos de contrato, assinatura eletrônica | Completo |
| Competições | Completo |
| Relatórios e dashboard | Completo |
| Avisos, mensagens, notificações | Completo |
| WhatsApp (gatilhos e modelos de mensagem) | Construído, ligado por concessão |
| Controle de acesso (biometria/facial) | Completo, dependente de consentimento válido |
| Loja, eventos, metas, fotos de treino, leads | Completo |
| Portal da Família (`sgcl-portal-familia`) | Completo |
| Portal do Professor (`sgcl-portal-professor`) | Completo |

### Plataforma SaaS

| Item | Situação |
|---|---|
| Control Plane: assinantes, planos, assinaturas, faturas, licenças por unidade | Completo |
| Autenticação de operadores e auditoria | Completo |
| Diretório de tenants autenticado por segredo compartilhado | Completo |
| Concessões assinadas Ed25519, com revisão e revogação | Completo |
| Snapshot de contagem Tenant → Control Plane | Completo |
| Cofre de credenciais de gateway (AES-256-GCM) | Completo |
| Precificação por faixa e por unidade | Completo |
| Banco do Control Plane provisionado (Neon, 8 migrações aplicadas) | Concluído |
| Control Plane publicado, com API e painel na mesma origem | Concluído |
| Painel do operador: login, visão geral, assinantes e detalhe | Concluído |
| Publicação automatizada pelo GitHub Actions | Concluído |

O painel cobre **ler** o domínio comercial. As ações — contratar assinatura,
emitir e baixar fatura, disparar e retomar provisionamento — ainda são feitas
por chamada direta à API, que já as expõe.

### Separação dos planos

A duplicação comercial entre os dois planos foi removida (PRs #212–#227):

- o perfil `SUPERADMIN` deixou de existir. Os perfis são `DONO`, `ADMIN`,
  `PROFESSOR` e `RECEPCAO`;
- usuários `SUPERADMIN` que ainda existam em bancos antigos são **recusados no
  login e em toda requisição autenticada**
  (`src/shared/security/superadminLegado.ts`), com orientação para usar o
  Control Plane;
- a rota `/plataforma` do Tenant Plane foi reduzida a um único endpoint de
  leitura (`GET /plataforma/minha-assinatura`). Planos, assinantes, cobrança e
  fechamento pertencem exclusivamente ao Control Plane;
- o `DONO` assumiu a gestão de unidades e o vínculo de usuários a unidades,
  que antes era exclusiva do operador do SaaS.

### Isolamento por tenant

Toda a camada de dados foi migrada de um client Prisma global para um client
**por requisição** (PRs #165–#211), resolvido a partir do contexto do tenant.
A regra é sustentada por um teste de arquitetura,
`src/shared/database/PrismaGlobalArquitetura.test.ts`, que varre `src/` e
falha se qualquer arquivo de produção importar o Prisma global. Sem essa
guarda, um único `import { prisma }` esquecido reintroduziria vazamento entre
academias sem que nenhum teste funcional acusasse.

A resolução de tenant por hostname está implementada e coberta por testes,
mas **desligada em produção** (`TENANT_RESOLUTION_ENABLED=false`). Com a flag
desligada o middleware é um `next()` puro e o sistema opera exatamente como
antes, contra o banco único atual.

---

# Próximos passos

Em ordem de dependência. Cada etapa tem um critério de conclusão verificável.

## 1. Publicar o Control Plane — CONCLUÍDO

Publicado em `https://sysbelt-control-plane.netlify.app`, servindo a API e o
painel do operador na mesma origem. Verificado em produção: `/api/health`
responde `status: ok`, o diretório responde 401 sem o segredo e 404 com ele, e
uma rota do painel responde 200 sem engolir as rotas de API.

O caminho até aqui deixou duas restrições registradas, porque voltam a
importar sempre que alguém for publicar:

**Os minutos de build do plano Free estavam esgotados.** Isso pausa os builds
que o Netlify roda, não a publicação de artefato pronto.

**A CLI do Netlify exige macOS 12 ou superior.** Em versões anteriores o
esbuild aborta com `dyld: Symbol not found: _SecTrustCopyCertificateChain`, e
não há forma de instalar que contorne isso.

As duas juntas levaram à publicação pelo GitHub Actions
(`.github/workflows/deploy-control-plane.yml`), que é hoje o caminho
recomendado: roda em Linux, compila nos runners do GitHub e envia só o
artefato. Detalhes em [`deploy.md`](deploy.md).

## 2. Domínio base dos tenants

`TENANT_APP_BASE_DOMAIN` ainda não foi definida. É ela que dá o formato das
URLs dos assinantes (`academia-a.app.sysbelt.com.br`) e é insumo obrigatório
da resolução por hostname.

Enquanto `TENANT_RESOLUTION_ENABLED=false`, o valor é inerte — serve apenas
para `configuracaoValida`. Antes da fase 4 ele precisa ser o domínio real,
registrado e com DNS wildcard apontando para o Netlify.

**Concluído quando:** o domínio está registrado, o wildcard resolve, e
`GET /health/tenant-resolution` retorna `prontaParaAtivar: true`.

## 3. Cofre de segredos

`TenantSecretProviderAws` está implementado e testado, mas nenhuma conta AWS
foi configurada. `AWS_REGION` não está definida — é o único insumo de
`awsConfigurada` no health check, e sua ausência é hoje o que mantém
`prontaParaAtivar` em `false`.

Atenção: `readinessTenant.ts` verifica apenas que a variável **existe**. O
verde não prova que há credencial válida nem que o cofre responde.

**Concluído quando:** um segredo de teste é criado no Secrets Manager e
recuperado pelo provider com a identidade e a versão conferidas.

## 4. Ativação em três fases

O script `npm run tenant:preflight` valida cada fase contra o health check e
recusa combinações inconsistentes:

```bash
npm run tenant:preflight -- --fase=configuracao https://sysbeltfp.netlify.app
npm run tenant:preflight -- --fase=habilitada   https://sysbeltfp.netlify.app
npm run tenant:preflight -- --fase=obrigatoria  https://sysbeltfp.netlify.app
```

| Fase | `ENABLED` | `REQUIRED` | Efeito |
|---|---|---|---|
| configuração | `false` | `false` | Variáveis presentes, middleware inerte |
| habilitada | `true` | `false` | Resolve por hostname; sem contexto, cai no banco atual |
| obrigatória | `true` | `true` | Sem contexto de tenant, a requisição falha |

**Cuidado operacional:** `REQUIRED=true` com `ENABLED=false` lança na carga do
módulo (`resolucaoTenantAtivavel.ts:10`) e derruba a API inteira — nem o
health check responde. As duas variáveis nunca devem divergir nesse sentido.

## 5. Tenant canário

Provisionar uma academia de teste, com banco próprio, e exercitar o ciclo
completo: contratação no Control Plane → provisionamento → concessão assinada
→ operação no Tenant Plane → snapshot de contagem → fatura.

`PROVISIONAMENTO_REAL_HABILITADO` permanece `false` até os adaptadores Neon e
de cofre estarem configurados; com ela desligada o worker responde 503, que é
o comportamento desejado enquanto o caminho não está pronto.

## 6. Migração da academia atual

A academia que hoje usa o sistema opera no banco compartilhado original.
Precisa virar um tenant como qualquer outro.

O script `npm run tenant:auditar-fronteira` verifica se o banco atual já está
em condição de ser tratado como tenant único — exige exatamente uma conta,
unidades de uma única conta e nenhum `SUPERADMIN` ativo. Ele sai com código 1
enquanto houver bloqueio.

**Antes de qualquer `prisma migrate deploy` em produção: fazer backup.**
Migrações deste projeto já removeram colunas e tornaram `Unidade.contaId`
`NOT NULL`.

## 7. Cobertura de testes dos portais — CONCLUÍDO

Os dois portais saíram de zero teste. Quatro defeitos reais apareceram no
caminho, e nenhum deles teria sido encontrado por leitura de código:

- a fila offline do Portal do Professor parava de esvaziar **em silêncio**
  quando a chave do `localStorage` continha algo que não fosse uma lista — as
  presenças marcadas no tatame ficavam presas no aparelho;
- o `sgcl-web` mostrava o texto da tela de login ("senha inválida") quando o
  problema era o backend fora do ar, porque não distinguia falta de conexão de
  credencial recusada;
- o `DONO` era barrado do Portal do Professor: a lista de perfis permitidos
  ainda citava `SUPERADMIN` e omitia `DONO`;
- o Portal da Família restaurava a seleção de um aluno que já tinha saído do
  vínculo do responsável — ao completar 18 anos, o aluno passa a acessar a
  própria conta. O backend recusava o acesso de qualquer forma, mas a tela
  pedia o que ia ser negado e quebrava sem explicação.

A matriz de frontends da CI perdeu a flag `possui_testes`: era ela que
permitia um app novo entrar isento, e foi assim que os portais ficaram
descobertos desde que nasceram.

---

# Dívidas conhecidas

| Item | Impacto |
|---|---|
| `archive/` versionado — 7 arquivos de código morto de `presencas` | Ruído; confunde busca |
| Arquivo `:` rastreado no Git | Criado por redirecionamento acidental |
| 11 arquivos de produção citando `SUPERADMIN` em comentários | Descrevem regra que não existe mais |
| `PERFIS_COM_CONSULTA_CROSS_UNIT` inclui `"SUPERADMIN"` | String morta em `resolverUnidadeConsulta.ts:5` |
| Rota `/presencas` comentada em `app.ts` | Decisão nunca formalizada |
| `deploy-control-plane.yml` não aplica migrations | Deliberado; ver [`deploy.md`](deploy.md) |

Nenhuma destas quebra comportamento — são limpeza. Os números foram conferidos
contra o repositório, não estimados.

---

# Critérios da versão 1.0

- [x] Todos os módulos operacionais implementados
- [x] Suíte de testes automatizada em CI
- [x] Primeira academia usando oficialmente o sistema
- [x] Isolamento por tenant implementado e guardado por teste de arquitetura
- [x] Control Plane construído, testado e com banco provisionado
- [x] Control Plane publicado, com painel de operador
- [x] Publicação reproduzível, independente da máquina de quem desenvolve
- [ ] Domínio base registrado
- [ ] Cofre de segredos configurado
- [ ] Resolução de tenant ativada
- [ ] Segunda academia assinante em produção
