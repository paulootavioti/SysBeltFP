# Sys Belt — Architecture Decision Records

## ADR-001 — Separação entre Backend e Frontend

Data: 25/06/2026

### Decisão

O Sys Belt será dividido em dois projetos:

- sgcl-api
- sgcl-web

### Motivação

Separar responsabilidades entre API e interface, facilitando manutenção, deploy e evolução independente.

### Impacto

O backend expõe uma API REST e o frontend consome essa API via Axios.

Status: Aceito.

---

## ADR-013 — Extração do domínio comercial para o Control Plane

Data: 11/08/2026

### Contexto

O domínio `plataforma` foi implementado dentro do mesmo backend, frontend e
schema usados pelas academias. Além das tabelas comerciais, `Conta` passou a
ser usada como fronteira entre filiais, `SUPERADMIN` acumulou o papel de
operador SaaS com administração operacional e recursos premium consultam a
assinatura diretamente no banco do tenant.

Com banco exclusivo por academia, esses acoplamentos precisam ser separados
sem remover funcionalidades internas de multi-unidade.

### Decisão

O domínio comercial será extraído para uma aplicação Control Plane com API,
frontend, autenticação e schema próprios.

No Tenant Plane:

- `Conta` será removida; todas as `Unidade` do banco pertencem implicitamente
  ao mesmo assinante;
- `DONO` continuará alcançando todas as unidades daquele banco;
- o operador SaaS não será um `Usuario` comum do tenant;
- `SUPERADMIN` deixará de significar operador global e será eliminado após a
  transição;
- suporte excepcional usará concessão temporária, explícita e auditada;
- direitos de plano serão recebidos como uma projeção local assinada, sem
  copiar preços, faturas ou credenciais comerciais;
- contagens agregadas por unidade serão expostas ao Control Plane por contrato
  máquina a máquina.

As telas administrativas de assinantes, planos e faturamento migram para o
frontend do Control Plane. “Minha assinatura” também será servida pelo Control
Plane em área do cliente, com autenticação ou SSO próprio, e não consultará
tabelas comerciais no banco operacional.

### Projeção de concessão

O Tenant Plane manterá somente o estado necessário para falhar fechado sem
consultar o Control Plane a cada operação:

- `tenantKey`;
- estado de acesso;
- recursos liberados;
- versão da concessão;
- emissão e expiração;
- assinatura criptográfica ou prova de origem;
- data da última sincronização.

Essa projeção não é fonte de verdade comercial e não inclui preço, forma de
pagamento ou histórico de faturas.

### Estratégia de transição

A extração será feita por fases compatíveis, não por remoção imediata:

1. criar contratos e testes de fronteira;
2. criar Control Plane e importar os dados comerciais existentes;
3. introduzir concessão local e sincronização de licenças;
4. mover telas e rotas comerciais;
5. substituir dependências de `Conta` e `SUPERADMIN` no Tenant Plane;
6. interromper gravações no módulo legado;
7. validar reconciliação;
8. remover tabelas, rotas e código legado em versão posterior.

### Consequências

- o financeiro B2B não compartilha banco nem autenticação com a operação da
  academia;
- o Tenant Plane fica mais simples: um banco representa uma academia/rede;
- direitos premium continuam disponíveis durante indisponibilidade curta do
  Control Plane, dentro da validade da concessão;
- será necessário criar uma área comercial própria para o assinante;
- migrations históricas permanecem preservadas, enquanto novos bancos poderão
  partir de um baseline limpo após a transição.

Status: Aceito.

---

## ADR-012 — Provisionamento e operação dos bancos exclusivos

Data: 11/08/2026

### Contexto

A ADR-010 exige banco operacional exclusivo por assinante, e a ADR-011 define
como o Tenant Plane seleciona esse banco. Falta estabelecer quem cria os
recursos, onde ficam as credenciais, como migrations chegam a todos os bancos
e como backup, restauração e encerramento funcionam sem depender de operação
manual no Netlify.

### Decisão

Na primeira arquitetura de produção, cada assinante terá um **projeto Neon
exclusivo**, dentro de uma organização controlada pelo Sys Belt. O Control
Plane terá projeto e banco próprios, sem compartilhar projeto com qualquer
academia.

O provisionamento será executado por um worker assíncrono do Control Plane,
inicialmente uma Netlify Background Function, e nunca dentro da requisição
síncrona de cadastro. Cada execução será idempotente e persistirá suas etapas
em `EventoProvisionamento`.

### Segredos

As URLs pooled e direta de cada tenant serão armazenadas como um segredo por
ambiente no AWS Secrets Manager. O Control Plane guardará somente o ARN/nome
da versão do segredo e os identificadores não sensíveis do projeto Neon.

Credenciais para acessar AWS Secrets Manager e a chave organizacional da API
Neon serão configuradas no Netlify como variáveis marcadas como secret, com
escopo apenas de Functions e separação entre produção e preview.

A chave organizacional Neon ficará disponível apenas ao worker de
provisionamento, não ao caminho HTTP do Tenant Plane. O runtime operacional
terá permissão apenas para ler os segredos de conexão necessários. Quando a
infraestrutura permitir, serão usadas credenciais temporárias e políticas de
menor privilégio em vez de chaves estáticas.

### Conexões

- aplicação: URL pooled, com SSL obrigatório;
- migrations, restauração e operações administrativas: URL direta;
- nenhum segredo é incluído em build, log, JWT ou banco central;
- rotação cria nova versão do segredo e invalida o cliente Prisma em cache;
- a credencial operacional não terá poderes para administrar o projeto Neon.

### Migrations

Migrations não serão executadas no build do site contra todos os tenants.
Depois de um deploy aprovado, um job de rollout consultará os ambientes e
aplicará `prisma migrate deploy` individualmente usando conexão direta.

O rollout será progressivo, com controle por ambiente:

1. banco de teste automatizado;
2. tenant interno/canário;
3. lote pequeno de clientes;
4. demais clientes em lotes limitados.

O Control Plane guardará `schemaVersionAtual`, `schemaVersionDesejada`, estado,
tentativa e erro sanitizado. Falha em um tenant interrompe apenas o lote
configurado, nunca reverte automaticamente bancos já migrados e nunca promove
o ambiente incompatível como saudável.

### Backup e restauração

Cada projeto terá janela de point-in-time restore compatível com o plano
operacional contratado pelo Sys Belt. Também haverá snapshot agendado quando
o plano do provedor oferecer o recurso.

Antes de migrations classificadas como arriscadas será criado um ponto de
recuperação. Restauração sempre ocorrerá por tenant, com solicitação,
justificativa, auditoria e validação posterior. Backup só é considerado
confiável após testes periódicos de restauração.

### Encerramento

Suspender ou cancelar uma assinatura não exclui o projeto. O encerramento
segue estados separados: bloqueio de acesso, exportação quando aplicável,
retenção, confirmação de exclusão e somente então remoção definitiva. A API de
exclusão do provedor nunca será chamada por um botão síncrono comum.

### Consequências

- isolamento do banco é acompanhado por isolamento de projeto e recuperação;
- o deploy da aplicação deixa de ser responsável por migrar produção inteira;
- surge um inventário confiável de versão e saúde de cada tenant;
- AWS Secrets Manager adiciona custo e uma dependência operacional;
- a chave de organização Neon torna-se segredo crítico de alto impacto;
- será necessário monitorar limites de projetos do plano Neon antes da venda;
- o limite de execução de background jobs exige retomada por etapas, não um
  processo monolítico para toda a frota.

Status: Aceito.

---

## ADR-011 — Resolução do tenant por hostname e conexão contextual

Data: 11/08/2026

### Contexto

Com um banco operacional exclusivo por academia, a API precisa descobrir o
tenant correto antes da primeira consulta, inclusive no login. O código atual
exporta um único `PrismaClient` global ligado a `DATABASE_URL`; esse desenho
não permite selecionar com segurança um banco por requisição.

A solução deve funcionar em funções serverless no Netlify, permitir um único
deploy da aplicação para vários assinantes e falhar sem acessar banco algum
quando a identidade da academia for inválida.

### Decisão

O Tenant Plane terá um único deploy compartilhado da aplicação e identificará
a academia pelo hostname canônico:

```text
https://{slug}.app.sysbelt.com.br
```

Frontend e API usarão a mesma origem. Uma chamada para
`https://cia-de-lutas.app.sysbelt.com.br/api/alunos`, por exemplo, resolve o
slug `cia-de-lutas` antes de executar autenticação ou regra de negócio.

O hostname identifica o ambiente pretendido, mas não concede acesso. Depois
da resolução, autenticação e autorização continuam obrigatórias.

### Regras de resolução

1. o hostname é normalizado para minúsculas e sem porta ou ponto final;
2. somente sufixos explicitamente permitidos são aceitos;
3. o slug é validado por formato estrito;
4. o resolvedor consulta o diretório do Control Plane;
5. somente ambiente `ATIVO` ou estado explicitamente autorizado pode abrir
   conexão;
6. o resultado fornece `tenantKey`, versão e referência do segredo;
7. segredo e URL pooled são obtidos pelo componente de infraestrutura;
8. a requisição recebe um `PrismaClient` ligado somente àquele banco;
9. falha em qualquer etapa encerra a chamada sem banco padrão ou fallback.

Não será aceito `x-tenant-id`, `contaId`, query string ou corpo enviado pelo
navegador como fonte de identidade do tenant. Domínios personalizados poderão
ser suportados posteriormente apenas por mapeamento previamente verificado no
Control Plane.

### Autenticação vinculada ao tenant

O login também será feito sob o hostname da academia. Isso evita procurar um
e-mail em todos os bancos e permite que a mesma pessoa use o mesmo e-mail em
academias diferentes.

Tokens emitidos pelo Tenant Plane conterão, além do usuário:

- `tenantKey`;
- `iss` e `aud` definidos;
- identificador e perfil do usuário;
- expiração.

Em toda requisição autenticada, o `tenantKey` do token deve ser igual ao
tenant resolvido pelo hostname. Divergência retorna `401` e não consulta o
banco indicado pelo token. O mesmo princípio vale para Portal da Família e
Portal do Professor.

### Contexto de banco por requisição

O `PrismaClient` global será substituído gradualmente por um provedor
contextual:

```text
requisição
  → resolver hostname
  → resolver tenant no Control Plane
  → obter segredo/URL pooled
  → obter cliente Prisma do tenant
  → executar autenticação e rota
  → liberar contexto
```

O cliente será disponibilizado por contexto assíncrono da requisição, sem
passar `tenantId` manualmente por todos os services. Importar um cliente
operacional fixo deixará de ser permitido.

Instâncias aquecidas da função poderão reutilizar clientes por `tenantKey` em
cache pequeno e limitado. A entrada será removida e desconectada por expiração
ou pressão do limite. Não haverá cache ilimitado de um pool para cada
assinante. Consultas da aplicação usarão URL pooled; migrations usarão conexão
direta fora do caminho HTTP.

### Rotas sem usuário autenticado

Rotas de login, landing pública e Portal da Família ainda exigem tenant
resolvido pelo hostname. Ser pública significa não exigir usuário, não operar
sem fronteira de banco.

Webhooks específicos de uma academia usarão endpoint no hostname dela e
validação criptográfica própria do provedor. Tarefas internas e eventos entre
Control Plane e Tenant Plane carregarão uma identidade assinada e idempotente;
não confiarão em um header livre enviado pela internet.

### Desenvolvimento, preview e testes

Ambientes não produtivos terão regras explícitas:

- desenvolvimento poderá usar `{slug}.localhost` ou um header de teste apenas
  quando `NODE_ENV` não for `production`;
- testes injetarão um resolvedor falso e bancos exclusivamente de teste;
- Deploy Previews usarão diretório e bancos não produtivos;
- nenhum preview poderá resolver segredos de produção;
- o domínio padrão `netlify.app` não será uma identidade válida de academia
  em produção.

### Consequências

- o hostname separa navegação e login antes de qualquer consulta operacional;
- um token obtido numa academia não funciona em outra;
- a aplicação continua com um único deploy, embora os bancos sejam exclusivos;
- todos os acessos Prisma precisarão migrar para o provedor contextual;
- o Control Plane torna-se dependência de resolução, exigindo cache curto e
  estratégia de indisponibilidade que preserve falha fechada;
- múltiplos clientes Prisma exigem limite e observabilidade para evitar
  exaustão de conexões em serverless.

### Alternativas rejeitadas

**Resolver pelo e-mail no login:** exigiria consultar vários bancos, vazaria a
existência de contas e seria ambíguo para usuários presentes em mais de uma
academia.

**Enviar tenant em header pelo frontend:** é facilmente manipulável e não
estabelece identidade confiável.

**Um site Netlify por academia como solução definitiva:** aumenta isolamento
de deploy, mas multiplica configuração, domínios e atualizações. Poderá existir
para clientes dedicados, sem ser o padrão.

**Criar e desconectar um `PrismaClient` em cada consulta:** aumenta latência e
pressão de conexão. O escopo é por requisição, com reutilização limitada por
instância aquecida.

Status: Aceito.

---

## ADR-010 — Banco operacional exclusivo por academia assinante

Data: 11/08/2026

### Contexto

O Sys Belt é um produto B2B oferecido por assinatura para academias e redes
de academias. Uma academia contratante pode possuir várias unidades, mas
academias contratantes diferentes não devem compartilhar o mesmo banco de
dados operacional.

O modelo inicialmente implementado colocou `Conta`, assinatura da plataforma
e dados das academias no mesmo schema PostgreSQL, usando `contaId` e
`unidadeId` como fronteiras lógicas. Esse modelo não atende ao isolamento
definido para o produto: uma falha de filtro poderia expor dados entre
assinantes e operações como backup, restauração e exclusão afetariam um banco
compartilhado.

### Decisão

A plataforma será dividida em dois planos arquiteturais:

1. **Control Plane (plataforma comercial B2B)**

   Sistema separado que administra clientes, planos, assinaturas, licenças,
   cobrança da plataforma, provisionamento e situação de acesso. Terá banco
   próprio e não armazenará alunos, responsáveis, aulas, mensalidades ou
   demais dados internos das academias.

2. **Tenant Plane (sistema operacional da academia)**

   Cada academia ou rede contratante terá um banco PostgreSQL exclusivo. As
   unidades pertencentes à mesma rede compartilharão apenas esse banco
   exclusivo e continuarão isoladas internamente por `unidadeId`.

Cada unidade ativa da academia representa uma licença faturável no Control
Plane. A situação comercial poderá liberar, suspender ou cancelar o acesso ao
Tenant Plane, mas nunca apagará automaticamente o banco operacional.

### Fronteiras de dados

O banco do Control Plane poderá armazenar:

- identidade e dados comerciais da academia contratante;
- plano, recursos e condições negociadas;
- unidades/licenças declaradas para cobrança;
- assinatura, período de teste e situação comercial;
- faturas e pagamentos do Sys Belt;
- identificador do ambiente provisionado;
- referência segura para localizar as credenciais do banco exclusivo.

Cada banco do Tenant Plane armazenará:

- usuários da academia e seus vínculos com unidades;
- alunos e responsáveis;
- turmas, aulas, currículo e graduações;
- contratos e financeiro interno da academia;
- competições, loja, mensagens, consentimentos e auditoria operacional;
- configurações e integrações específicas da academia.

Credenciais de bancos de clientes não serão armazenadas em texto puro no
banco central. Serão cifradas ou mantidas em um gerenciador de segredos, com
acesso restrito ao componente responsável por resolver a conexão.

### Identidade do assinante

Toda requisição ao Tenant Plane deverá resolver a academia de forma confiável
antes de acessar dados. A origem dessa identidade poderá ser domínio,
subdomínio ou outro identificador emitido pelo Control Plane, mas nunca será
aceita apenas com base em um `contaId` arbitrário enviado pelo cliente.

O mecanismo concreto de resolução e conexão será definido em decisão
arquitetural posterior.

### Provisionamento e ciclo de vida

Contratar uma assinatura deverá iniciar um processo de provisionamento que:

1. cria o banco exclusivo;
2. aplica todas as migrations do Tenant Plane;
3. cria a configuração e o administrador inicial;
4. registra no Control Plane o estado do provisionamento;
5. libera o acesso somente após a conclusão íntegra do processo.

Migrations, backup, restauração, observabilidade e exclusão serão executados
por academia, permitindo tratar um cliente sem afetar os demais.

### Consequências positivas

- isolamento físico dos dados operacionais entre assinantes;
- menor impacto de falhas de escopo em consultas;
- backup, restauração e migração independentes;
- exclusão e retenção de dados por cliente;
- possibilidade de mover clientes maiores para infraestrutura dedicada;
- fronteira clara entre cobrança B2B e financeiro interno da academia.

### Custos e riscos aceitos

- maior complexidade de provisionamento e operação;
- migrations precisam ser orquestradas em vários bancos;
- monitoramento deve identificar banco e versão de schema por cliente;
- pool de conexões precisa considerar limites da infraestrutura serverless;
- relatórios globais não poderão consultar diretamente dados operacionais de
  todos os clientes;
- o módulo `plataforma` já implementado precisará ser extraído do schema e da
  aplicação operacional.

### Alternativas rejeitadas

**Um único banco e um único schema com `contaId`:** rejeitado porque fornece
apenas isolamento lógico e aumenta o impacto de falhas de filtro, restauração
e manutenção.

**Um schema PostgreSQL por academia no mesmo banco:** rejeitado como modelo
principal porque ainda compartilha instância, credenciais e limites
operacionais, além de complicar migrations sem entregar a independência de
um banco exclusivo.

**Uma instalação manual completa por cliente:** rejeitada como arquitetura
definitiva porque dificulta atualizações consistentes e escala operacional,
embora possa ser usada temporariamente durante a transição.

### Impacto no código existente

- `Conta`, `PlanoPlataforma`, `AssinaturaPlataforma` e `FaturaPlataforma`
  pertencem ao futuro Control Plane;
- o motor de preço por unidade e a memória de cálculo das faturas serão
  reaproveitados no Control Plane;
- `Unidade` e os módulos operacionais permanecem no Tenant Plane;
- referências comerciais não devem virar relações Prisma entre os dois
  bancos;
- até a extração, o módulo atual é considerado uma implementação transitória
  e não o desenho final de produção.

### Fora do escopo desta decisão

Serão definidos separadamente:

- repositório e stack do Control Plane;
- estratégia de domínio/subdomínio e identificação do tenant;
- provedor dos bancos e gerenciamento de segredos;
- mecanismo de conexão compatível com Netlify;
- orquestração de migrations e provisionamento;
- autenticação entre Control Plane e Tenant Plane;
- política de backup, retenção, exportação e exclusão;
- plano de migração das estruturas já implementadas.

Status: Aceito.

---

## ADR-002 — Uso de JWT para autenticação

Data: 25/06/2026

### Decisão

A autenticação será baseada em JWT.

### Motivação

Permitir autenticação stateless, compatível com aplicações web modernas.

### Impacto

Todas as rotas protegidas exigem token no header Authorization.

Status: Aceito.

---

## ADR-003 — Controle de acesso por perfil

Data: 25/06/2026

### Decisão

O sistema terá perfis de acesso:

- ADMIN
- PROFESSOR
- RECEPCAO

### Motivação

Cada usuário deve acessar apenas as funcionalidades compatíveis com sua função.

### Impacto

As rotas usam middlewares de autenticação e autorização.

Status: Aceito.

---

## ADR-004 — Faixa não é alterada pelo cadastro do aluno

Data: 25/06/2026

### Decisão

A faixa do aluno não será alterada pela edição cadastral.

### Motivação

A faixa representa evolução técnica e deve ser controlada pelo módulo de Graduações.

### Impacto

O endpoint de edição do aluno atualiza apenas dados cadastrais.

Status: Aceito.

---

## ADR-005 — Criação de Design System próprio

Data: 25/06/2026

### Decisão

O frontend terá componentes reutilizáveis próprios.

### Motivação

Garantir consistência visual, reduzir duplicação de código e facilitar evolução.

### Impacto

Novas telas devem priorizar componentes reutilizáveis antes de CSS inline.

Status: Aceito.

---

## ADR-006 — Arquitetura modular por domínio

Data: 25/06/2026

### Decisão

Backend e frontend são organizados em módulos por domínio de negócio (alunos, aulas, mensalidades, graduações, etc.), cada um com sua própria pasta autocontida.

### Motivação

Separar responsabilidades por domínio, facilitando localizar e evoluir cada funcionalidade sem impactar as demais.

### Impacto

Cada módulo do backend segue o padrão `controller.ts` / `routes.ts` / `services/`; cada módulo do frontend segue `pages/` / `components/` / `services/` / `hooks/` / `types/` / `schema/`.

Status: Aceito.

---

## ADR-007 — React Hook Form + Zod para formulários

Data: 25/06/2026

### Decisão

Todos os formulários do frontend usam React Hook Form para controle de estado e Zod para validação, via `zodResolver`.

### Motivação

Padronizar validação e reduzir boilerplate de formulários controlados manualmente.

### Impacto

Todo formulário novo deve seguir o padrão `useForm` + `FormProvider` + schema Zod dedicado.

Status: Aceito.

---

## ADR-008 — Camada de Service/ApiClient no frontend

Data: 25/06/2026

### Decisão

Nenhuma página ou componente chama axios/fetch diretamente; toda chamada HTTP passa por uma classe Service do módulo, que por sua vez usa o ApiClient compartilhado.

### Motivação

Isolar a página da forma como os dados são buscados, facilitando troca de implementação e testes.

### Impacto

Páginas dependem apenas de `Service.metodo()`; o ApiClient centraliza o tratamento de resposta do Axios.

Status: Aceito.

---

## ADR-009 — Regra de negócio apenas em Services (backend)

Data: 25/06/2026

### Decisão

Controllers do backend não contêm lógica de negócio; toda regra fica em uma classe Service dedicada por ação.

### Motivação

Manter Controllers finos (apenas leem request e devolvem response), facilitando reuso e teste da lógica de negócio isoladamente.

### Impacto

Cada ação de Controller instancia e chama um XxxService, nunca acessa o Prisma diretamente.

Status: Aceito.
