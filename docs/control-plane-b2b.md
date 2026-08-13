# Control Plane B2B do Sys Belt

> Modelo funcional e de dados do sistema que administra as academias
> assinantes do Sys Belt. Este documento detalha a ADR-010 sem escolher ainda
> o mecanismo de conexão aos bancos exclusivos.

## 1. Objetivo

O Control Plane é o sistema comercial e operacional do fornecedor do Sys Belt.
Ele cadastra academias clientes, vende planos, controla licenças por unidade,
emite cobranças B2B e provisiona um banco PostgreSQL exclusivo para cada
academia ou rede.

Ele não substitui o sistema usado pela academia no dia a dia e não armazena
dados de alunos, aulas ou mensalidades cobradas dos alunos.

## 2. Vocabulário do produto

| Termo | Significado |
|---|---|
| Assinante | Empresa ou pessoa que contrata o Sys Belt. |
| Academia | Cliente B2B; pode representar uma unidade única ou uma rede. |
| Unidade | Matriz ou filial da mesma academia/rede. Cada unidade ativa é uma licença. |
| Ambiente | Conjunto de recursos exclusivos provisionados para um assinante. |
| Tenant | Identidade técnica do assinante no sistema operacional. |
| Control Plane | Sistema central de contratos, cobrança e provisionamento. |
| Tenant Plane | Aplicação operacional e banco exclusivo usados pela academia. |
| Plano | Oferta comercial com preço, limites e funcionalidades. |
| Assinatura | Contratação de um plano por um assinante. |

No Control Plane, o termo adotado para o cliente será `Assinante`. No Tenant
Plane, `Unidade` continuará representando as filiais da academia.

## 3. Limites de responsabilidade

### Control Plane

- cadastro comercial do assinante;
- contatos administrativos e de cobrança;
- catálogo e versionamento de planos;
- assinatura, teste, suspensão e cancelamento;
- quantidade de licenças/unidades contratadas;
- preço por unidade e faixa de alunos;
- faturamento e pagamentos do Sys Belt;
- provisionamento e saúde do ambiente;
- versão do schema de cada banco exclusivo;
- trilha de auditoria das ações do operador;
- comunicação segura com o Tenant Plane.

### Tenant Plane

- autenticação dos usuários da academia;
- cadastro de unidades da própria academia;
- alunos, responsáveis, turmas e aulas;
- currículo, graduações e competições;
- mensalidades, contratos e caixa da academia;
- portais da Família e do Professor;
- loja, mensagens, consentimentos e controle de acesso;
- auditoria das operações internas da academia.

### Dados proibidos no Control Plane

O Control Plane não deve replicar:

- nome, documento, saúde ou contato de alunos e responsáveis;
- presenças, notas, fotos e evolução pedagógica;
- contratos e mensalidades dos alunos;
- conversas entre família e academia;
- biometria ou credenciais de acesso físico.

Indicadores agregados só poderão ser enviados ao Control Plane quando houver
finalidade operacional ou comercial explícita. A contagem usada para cobrança
é um exemplo permitido; a lista que compõe essa contagem não é.

## 4. Modelo conceitual

```text
Assinante
├── Contatos
├── Assinatura ── PlanoVersionado
├── Licenças de unidade
├── Ambiente exclusivo
│   └── referência para segredo da conexão
├── Faturas
│   └── memória de cálculo por unidade
└── Eventos de auditoria e provisionamento
```

## 5. Entidades do Control Plane

### Assinante

Representa a academia ou rede que mantém relação comercial com o Sys Belt.

Campos essenciais:

- `id`: identificador interno não sequencial exposto externamente;
- `nomeFantasia`;
- `razaoSocial` opcional;
- `documento` (CPF ou CNPJ normalizado);
- `emailCobranca`;
- `telefone`;
- `slug`: identificador legível e único;
- `status`: `PROSPECT`, `EM_PROVISIONAMENTO`, `ATIVO`, `SUSPENSO`,
  `CANCELADO` ou `ERRO_PROVISIONAMENTO`;
- timestamps de criação e atualização.

O documento deve ser único entre assinantes ativos, com tratamento definido
para recontratação de cliente cancelado.

### ContatoAssinante

Permite mais de uma pessoa vinculada ao cliente sem confundir contato
comercial com usuário do sistema da academia.

Tipos iniciais:

- `PROPRIETARIO`;
- `ADMINISTRATIVO`;
- `FINANCEIRO`;
- `TECNICO`.

### Plano

É a identidade comercial de uma oferta, por exemplo Essencial ou Premium.
Alterar uma oferta não deve reescrever contratos existentes.

Campos essenciais:

- `id`, `nome`, `descricao` e `ativo`;
- relacionamento com uma ou mais versões imutáveis.

### PlanoVersao

Retrato imutável das condições disponíveis em determinado período.

Campos essenciais:

- `planoId` e `versao`;
- vigência inicial e final;
- `alunosPorBloco`;
- `precoPorBlocoCentavos`;
- `blocosMinimosPorUnidade`;
- recursos liberados;
- moeda;
- metadados comerciais necessários à explicação do preço.

Uma versão usada por assinatura ou fatura não pode ser editada. Uma mudança de
preço cria outra versão.

### Assinatura

Relaciona o assinante à versão contratada do plano.

Campos essenciais:

- `assinanteId`;
- `planoVersaoId`;
- `status`: `TESTE`, `ATIVA`, `INADIMPLENTE`, `SUSPENSA` ou `CANCELADA`;
- início, fim do teste e cancelamento;
- dia de vencimento;
- condições negociadas opcionais;
- política de cobrança vigente;
- timestamps.

Só pode existir uma assinatura corrente por assinante. O histórico de trocas
de plano e condições deve ser preservado.

### LicencaUnidade

Representa uma unidade declarada pelo assinante e usada na cobrança.

Campos essenciais:

- `assinanteId`;
- `tenantUnidadeId`: identificador correspondente no banco exclusivo;
- `nomeExibicao`;
- `status`: `PENDENTE`, `ATIVA` ou `ENCERRADA`;
- início e encerramento da cobrança;
- data da última sincronização.

O Control Plane não cria uma relação de banco com a tabela `Unidade` do Tenant
Plane. `tenantUnidadeId` é apenas uma referência externa validada pela
integração.

### AmbienteTenant

Registra o ambiente exclusivo provisionado para o assinante.

Campos essenciais:

- `assinanteId`, único;
- `tenantKey`, opaco e único;
- `status`: `PENDENTE`, `PROVISIONANDO`, `ATIVO`, `FALHOU`, `SUSPENSO` ou
  `DESATIVADO`;
- provedor e região;
- identificador externo do banco;
- referência do segredo, nunca a senha em texto puro;
- versão atual e versão desejada do schema;
- datas da última migration, verificação de saúde e backup conhecido.

### Fatura

Cobrança emitida pelo Sys Belt para o assinante.

Campos essenciais:

- `assinanteId` e `assinaturaId`;
- competência e vencimento;
- status: `RASCUNHO`, `ABERTA`, `PAGA`, `VENCIDA`, `CANCELADA` ou
  `ESTORNADA`;
- valores em centavos;
- identificadores do gateway;
- snapshot da versão do plano e das condições negociadas;
- memória de cálculo por unidade;
- timestamps de emissão, pagamento, cancelamento e estorno.

O par assinatura/competência deve ser único para garantir idempotência.

### EventoProvisionamento

Registra cada tentativa e etapa do provisionamento sem depender apenas de
logs efêmeros.

Campos essenciais:

- `ambienteTenantId`;
- tipo da operação;
- chave de idempotência;
- status `PENDENTE`, `EXECUTANDO`, `CONCLUIDO` ou `FALHOU`;
- etapa atual;
- quantidade de tentativas;
- erro sanitizado;
- timestamps.

### AuditLogPlataforma

Registra ações de operadores, automações e integrações sobre assinantes,
assinaturas, faturas e ambientes. Deve guardar ator, origem, ação, alvo e
mudanças relevantes sem registrar segredos.

## 6. Regras de cobrança

1. Cada `LicencaUnidade` ativa é calculada separadamente.
2. Cada unidade paga ao menos `blocosMinimosPorUnidade`.
3. Alunos ativos são agrupados por unidade no Tenant Plane.
4. O Tenant Plane envia apenas identificador da unidade e contagem agregada.
5. Uma pessoa vinculada a duas unidades conta nas duas lotações.
   O cadastro do aluno mantém uma unidade principal e vínculos explícitos com
   cada outra unidade da mesma academia em que pode frequentar. A contagem usa
   esses vínculos, sem duplicar o cadastro ou enviar dados pessoais ao Control
   Plane.
6. A fatura guarda o snapshot das contagens e preços usados.
7. Falha de sincronização não deve gerar cobrança silenciosamente com dados
   presumidos; a competência fica pendente para revisão ou nova tentativa.
8. Reprocessar a mesma competência não duplica a fatura.

## 7. Máquinas de estado

### Assinante

```text
PROSPECT
   │ contratação
   ▼
EM_PROVISIONAMENTO ── falha ──► ERRO_PROVISIONAMENTO
   │ concluído                       │ nova tentativa
   ▼                                 └──────────────┐
 ATIVO ◄──────── reativação ───── SUSPENSO         │
   │                              ▲                │
   ├── inadimplência/política ────┘                │
   └── cancelamento ───────────► CANCELADO ◄───────┘
```

Cancelamento é uma situação comercial. Exclusão do ambiente é outro processo,
com retenção, exportação e autorização próprias.

### Provisionamento

```text
PENDENTE → PROVISIONANDO → ATIVO
                 │
                 └──────→ FALHOU → PROVISIONANDO

ATIVO → SUSPENSO → ATIVO
ATIVO/SUSPENSO → DESATIVADO
```

## 8. Fluxos principais

### Contratação

1. operador cadastra ou converte o assinante;
2. escolhe plano, condição comercial e período de teste;
3. cria a assinatura;
4. solicita provisionamento com chave de idempotência;
5. banco exclusivo é criado e migrado;
6. administrador inicial é criado no Tenant Plane;
7. verificação de saúde é executada;
8. ambiente e assinante passam para `ATIVO`;
9. convite ou instrução de primeiro acesso é enviado.

Se uma etapa falhar, o evento guarda onde parou. Repetir a operação deve
continuar com segurança, sem criar outro banco ou outra assinatura.

### Sincronização das licenças

1. uma unidade é criada, ativada ou encerrada no Tenant Plane;
2. o Tenant Plane publica um evento assinado;
3. o Control Plane cria ou atualiza `LicencaUnidade`;
4. reconciliação periódica compara o resumo do tenant com o estado central;
5. divergências ficam visíveis ao operador.

### Fechamento mensal

1. Control Plane seleciona assinaturas faturáveis;
2. solicita contagem agregada por unidade ao Tenant Plane;
3. valida atualidade, assinatura e integridade da resposta;
4. calcula cada licença separadamente;
5. grava fatura e memória de cálculo;
6. envia a cobrança ao gateway;
7. processa webhook de pagamento de forma idempotente.

### Suspensão

1. regra comercial ou operador suspende a assinatura;
2. Control Plane registra auditoria;
3. Tenant Plane recebe uma concessão de acesso atualizada;
4. usuários veem uma tela de suspensão, sem acesso aos módulos;
5. banco permanece preservado e rotinas autorizadas de backup continuam.

## 9. Contrato mínimo entre os sistemas

O contrato definitivo será versionado, mas precisa contemplar:

- consultar saúde e versão do schema;
- criar o administrador inicial;
- receber a concessão de plano e recursos;
- sincronizar unidades/licenças;
- obter contagem agregada por unidade para uma data de corte;
- suspender ou reativar o acesso;
- confirmar eventos com idempotência.

Toda comunicação máquina a máquina deve ser autenticada e assinada. Nenhum
endpoint administrativo confiará apenas em domínio, `tenantKey` ou endereço
de origem.

## 10. Perfis do Control Plane

Perfis iniciais, separados dos usuários de qualquer academia:

- `OPERADOR`: consulta assinantes e acompanha provisionamento;
- `FINANCEIRO`: administra faturas, pagamentos e condições autorizadas;
- `SUPORTE`: consulta saúde e executa operações seguras de suporte;
- `ADMIN_PLATAFORMA`: configura planos, operadores e ações sensíveis.

Acesso direto a banco de cliente não é uma permissão comum de suporte. Quando
indispensável, deverá usar autorização explícita, prazo, justificativa e
auditoria.

## 11. Requisitos não funcionais

- isolamento: nenhuma conexão pode ser reutilizada para outro tenant por
  engano;
- idempotência: contratação, provisionamento, fechamento e webhooks;
- rastreabilidade: toda mudança comercial ou operacional relevante auditada;
- recuperação: backup e restauração testáveis por assinante;
- observabilidade: métricas por ambiente sem coletar dados pessoais;
- compatibilidade: migrations progressivas e controle da versão de schema;
- falha fechada: tenant não resolvido ou segredo indisponível não acessa um
  banco padrão;
- minimização: Control Plane recebe somente o agregado necessário.

## 12. Critérios de aceite deste modelo

O modelo estará pronto para implementação quando forem decididos:

- como uma requisição resolve o `tenantKey`;
- como a aplicação Netlify obtém e reutiliza a conexão correta;
- onde ficam os segredos de cada banco;
- quem cria bancos e executa migrations;
- como o Tenant Plane valida concessões do Control Plane;
- política de backup, retenção e encerramento;
- estratégia de repositório e deploy do Control Plane.

Essas decisões pertencem aos passos arquiteturais seguintes e não devem ser
embutidas implicitamente na primeira implementação.
