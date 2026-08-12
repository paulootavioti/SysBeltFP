# Mapa de extração para o Control Plane

> Inventário do código atual e destino de cada responsabilidade. Este mapa é
> a referência do passo 5 da separação B2B.

## Estado da implementação

A fundação independente está em `control-plane/`, com pacote Node, configuração
Prisma, testes e deploy Netlify próprios. Nenhuma dependência do Tenant Plane é
importada por essa aplicação. O módulo legado `src/modules/plataforma` continua
ativo durante a transição e só será removido após migração e reconciliação.

O primeiro schema comercial já modela `Assinante`, `ContatoAssinante`, `Plano`,
`PlanoVersao`, `Assinatura`, `Fatura` e `FaturaItem`. Provisionamento, ambiente
tenant e auditoria serão adicionados separadamente na etapa correspondente.

A autenticação própria do Control Plane usa `OperadorPlataforma` e os perfis
`OPERADOR`, `FINANCEIRO`, `SUPORTE` e `ADMIN_PLATAFORMA`. Ela não consulta nem
cria registros na tabela `Usuario` do Tenant Plane.

## Legenda

| Classificação | Significado |
|---|---|
| Control Plane | Deve sair do sistema operacional e existir no sistema B2B. |
| Tenant Plane | Permanece no banco e aplicação exclusivos da academia. |
| Contrato | Existe nos dois lados apenas como integração versionada. |
| Transitório | Permanece temporariamente para migração e depois é removido. |

## Schema Prisma

### Migram para o Control Plane

| Estrutura atual | Destino | Observação |
|---|---|---|
| `Conta` | `Assinante` | Evolui para cadastro comercial, contatos, slug e estado. |
| `PlanoPlataforma` | `Plano` + `PlanoVersao` | Preço e recursos passam a ser versionados e imutáveis por contratação. |
| `AssinaturaPlataforma` | `Assinatura` | Mantém contratação, teste, condição negociada e status comercial. |
| `FaturaPlataforma` | `Fatura` | Mantém idempotência e memória de cálculo por licença. |
| `StatusAssinaturaPlataforma` | enum do Control Plane | Não pertence ao financeiro interno da academia. |
| `StatusFaturaPlataforma` | enum do Control Plane | Será ampliado conforme o modelo B2B. |

### Permanecem no Tenant Plane

Todos os demais modelos operacionais permanecem, incluindo:

- `Unidade`, `Arena`, `Usuario` e `UsuarioUnidade`;
- `Aluno`, `Responsavel`, `Consentimento` e `AuditLog`;
- `Turma`, `Aula`, currículo, técnicas e graduações;
- `Plano`, `Assinatura`, `Mensalidade`, contratos e formas de pagamento da
  academia;
- competições, loja, leads, mensagens, fotos e controle de acesso.

É essencial preservar a distinção: `Plano`/`Assinatura` atuais são o produto
vendido pela academia aos alunos; `PlanoPlataforma`/`AssinaturaPlataforma`
são o produto B2B vendido pelo Sys Belt.

### Mudanças no Tenant Plane

`Unidade.contaId` e a relação com `Conta` serão removidas após a migração. Um
banco exclusivo já é a fronteira da academia; todas as unidades nele contidas
pertencem à mesma rede.

Será introduzida uma projeção operacional, provisoriamente chamada
`ConcessaoPlataforma`, contendo apenas:

- `tenantKey` único;
- `statusAcesso`;
- `recursos`;
- `versao`;
- `emitidaEm`, `expiraEm` e `sincronizadaEm`;
- prova criptográfica da origem.

Ela não terá relação Prisma com tabelas do Control Plane.

## Backend atual

### Migração integral para o Control Plane

O diretório `src/modules/plataforma` será dividido assim:

| Arquivo/responsabilidade | Destino |
|---|---|
| `controller.ts` | Novo controller da API B2B, exceto a rota legada do cliente. |
| `routes.ts` | Novas rotas autenticadas do Control Plane. |
| `CreateContaService` | `CreateAssinanteService` + início do provisionamento. |
| `PlanosPlataformaService` | Catálogo e versões de planos B2B. |
| `AlterarAssinaturaPlataformaService` | Gestão da assinatura B2B. |
| `ListContasService` | Listagem de assinantes e saúde comercial. |
| `GerarFaturasPlataformaService` | Fechamento B2B consumindo contagens assinadas. |
| `MarcarFaturaPagaService` | Conciliação financeira do Control Plane. |
| `ObterAssinaturaDaContaService` | Consulta comercial do operador/cliente. |
| `competencia.ts` | Utilitário financeiro do Control Plane. |
| `precoPlataforma.ts` | Motor puro de preço do Control Plane. |
| `validation.ts` | Schemas da API B2B. |
| testes correspondentes | Suíte do Control Plane. |

O endpoint cron `/plataforma/faturas/fechamento/cron` também migra. Seu segredo
atual não será compartilhado com o Tenant Plane.

### Responsabilidades que serão separadas

`ContarAlunosDaContaService` e
`ContarAlunosPorUnidadeDaContaService` não migram literalmente:

- a consulta aos alunos permanece no Tenant Plane;
- o contrato retorna somente unidade, estado e contagem agregada;
- a orquestração e o cálculo da fatura ficam no Control Plane.

`recursosDoPlano.ts` também será dividido:

- catálogo e decisão comercial ficam no Control Plane;
- `tenantTemRecurso()` no Tenant Plane consulta `ConcessaoPlataforma`;
- módulos como WhatsApp não consultam assinatura ou plano comercial.

### Pontos externos ao módulo que precisam mudar

| Código atual | Problema | Substituição |
|---|---|---|
| `src/app.ts` registra `/plataforma` | Mistura APIs B2B e tenant | Remover após disponibilizar endpoints de contrato. |
| `shared/utils/contaDoUsuario.ts` | Usa `Conta` como fronteira | Operar sobre todas as unidades do banco exclusivo. |
| `CreateUsuarioService`/`UpdateUsuarioService` | Valida unidades pela conta | Apenas validar que IDs existem neste banco. |
| `CreateUnidadeService` | Recebe/infere `contaId` | Criar unidade local e sincronizar licença. |
| `ListUnidadesOpcoesService` | Escopo global por conta | Listar somente unidades do banco atual. |
| `unidades/validation.ts` | Aceita `contaId` | Remover o campo da API tenant. |
| `whatsapp/EnviarMensagemWhatsappService` | Consulta plano comercial local | Consultar concessão local válida. |
| testes `PerfilDonoEFronteira` | Simulam várias contas no mesmo banco | Substituir por testes de isolamento entre bancos/contextos. |
| `shared/testing/criarUnidadeDeTeste.ts` | Cria conta e assinatura auxiliar | Criar somente unidade e concessão fake quando necessária. |

Outros recursos premium (`GATEWAY_AUTOMATICO` e `CONTROLE_ACESSO`) deverão usar
a mesma função central de concessão, mesmo onde hoje a trava ainda não esteja
aplicada de forma uniforme.

## Perfis e autenticação

### Tenant Plane

- `DONO`: permanece e alcança todas as unidades do banco;
- `ADMIN`, `PROFESSOR` e `RECEPCAO`: permanecem;
- `SUPERADMIN`: removido como operador global após a transição.

Onde `SUPERADMIN` hoje executa tarefas legítimas dentro de uma academia, a
permissão será atribuída a `DONO` ou a um `ADMIN` autorizado. Exemplos:

- cadastrar unidades e arenas;
- administrar usuários e vínculos;
- visualizar todas as unidades da própria rede.

### Control Plane

Terá usuários e autenticação próprios:

- `OPERADOR`;
- `FINANCEIRO`;
- `SUPORTE`;
- `ADMIN_PLATAFORMA`.

Nenhum desses perfis será gravado na tabela `Usuario` de uma academia. Acesso
de suporte ao Tenant Plane será temporário e auditado, não um bypass permanente
em `ensureRole`.

### Arquivos afetados

- `src/shared/constants/perfis.ts`;
- `src/shared/middlewares/ensureRole.ts`;
- `src/shared/middlewares/ensureAuthenticated.ts`;
- tipos Express de `req.user`;
- schemas e formulários de usuário;
- testes de permissões e multi-unidade.

## Frontend atual

### Migram para o frontend do Control Plane

- `pages/Assinantes`;
- `components/AssinaturaDaConta`;
- `components/NovaContaForm`;
- `components/PlanosDaPlataforma`;
- métodos de `PlataformaService` para contas, planos, fechamento e baixa;
- tipos `ContaResumo`, `PlanoPlataforma` e `ResultadoFechamento`;
- rota `/plataforma/assinantes`;
- item “Assinantes (SysBelt)” da navegação.

### “Minha assinatura”

`pages/MinhaAssinatura`, seu hook e tipos são comerciais. A funcionalidade
migra para a área do cliente no Control Plane. Durante a transição, o Tenant
Plane poderá mostrar um link autenticado para essa área; não manterá leitura
direta de faturas no banco operacional.

### Permanecem e precisam ser ajustados

- seletor de unidade ativa;
- gestão de unidades, arenas e usuários;
- permissões do perfil `DONO`;
- telas que hoje usam `SUPERADMIN` como bypass;
- navegação e rota inicial por perfil.

O componente `SeletorUnidadeVisualizada`, criado para o operador atravessar
assinantes, será removido. O `SeletorUnidadeAtiva` permanece para pessoas
vinculadas a várias filiais da mesma academia.

## Integrações entre os planos

### Tenant → Control Plane

- evento de unidade criada, ativada, renomeada ou encerrada;
- snapshot agregado de alunos ativos por unidade e data de corte;
- versão de schema e health check;
- confirmação de aplicação da concessão.

### Control Plane → Tenant

- concessão assinada de acesso e recursos;
- solicitação idempotente de bootstrap;
- suspensão/reativação;
- solicitação de contagem para fechamento;
- comandos administrativos estritamente definidos.

Não haverá consultas SQL cruzadas nem foreign keys entre bancos.

## Migrations existentes

As migrations já publicadas não serão editadas, pois isso quebraria bancos que
já registraram seus checksums.

Estratégia:

1. criar migrations aditivas para concessão e contratos de integração;
2. copiar/importar dados comerciais para o Control Plane;
3. manter tabelas legadas em modo somente leitura durante reconciliação;
4. remover relações como `Unidade.contaId` apenas após o corte;
5. criar migration posterior que remove as tabelas comerciais;
6. gerar um baseline limpo do Tenant Plane para novos bancos somente depois de
   validar a migração dos ambientes existentes.

## Matriz resumida

| Domínio | Control Plane | Tenant Plane |
|---|:---:|:---:|
| cadastro comercial da academia | ✓ | — |
| plano e assinatura Sys Belt | ✓ | projeção de concessão |
| fatura paga pela academia ao Sys Belt | ✓ | — |
| unidades/filiais operacionais | referência/licença | ✓ |
| contagem de alunos para cobrança | snapshot | cálculo da contagem |
| alunos e responsáveis | — | ✓ |
| mensalidade paga pelo aluno | — | ✓ |
| usuários da academia | — | ✓ |
| operadores do SaaS | ✓ | — |
| recursos premium | fonte de verdade | decisão local por concessão |
| provisionamento e schema fleet | ✓ | reporta saúde/versão |

## Ordem segura de implementação

1. criar estrutura independente do Control Plane;
2. criar schema comercial novo e testes;
3. implementar autenticação de operadores;
4. implementar provisionamento e inventário;
5. criar contrato de concessão e contagem agregada;
6. adicionar `ConcessaoPlataforma` ao Tenant Plane;
7. trocar travas de recursos para a concessão;
8. migrar telas administrativas e “Minha assinatura”;
9. importar e reconciliar dados comerciais atuais;
10. remover capacidade de gravação do módulo legado;
11. substituir `Conta` e `SUPERADMIN` no Tenant Plane;
12. remover código e tabelas legadas;
13. criar baseline limpo para novos tenants.

Cada item deve ter rollback ou compatibilidade com a versão anterior antes do
próximo iniciar.

## Critérios para concluir a extração

- nenhuma tabela comercial existe nos novos bancos de tenant;
- Tenant Plane inicia sem `Conta`, assinatura ou fatura B2B;
- operador SaaS não autentica no banco de academia;
- duas academias usam bancos e contextos distintos;
- DONO continua administrando todas as próprias unidades;
- cobrança recebe contagem agregada e produz a mesma memória por unidade;
- recurso suspenso é bloqueado pela concessão local;
- Control Plane indisponível não causa acesso cruzado nem liberação aberta;
- dados comerciais importados reconciliam com o legado;
- migrations e restauração foram testadas em pelo menos dois tenants.
