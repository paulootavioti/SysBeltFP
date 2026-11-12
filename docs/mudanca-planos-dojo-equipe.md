# Mudança de planos Dojô e Equipe

## Implementado no Tenant Plane

O Tenant Plane aceita `FAIXA_ALUNOS` (legado) e `FIXO_MENSAL`. A migration
cria Dojô (R$ 97,00) e Equipe (R$ 1.570,00), inativa o catálogo antigo sem
apagar seus registros e preserva faturas já emitidas. A condição negociada da
assinatura (`precoPorBlocoCentavos`, nome legado) substitui o preço aplicável:
por bloco no plano legado e mensal no plano fixo. Trocas de plano valem na
próxima fatura; faturas com a competência já criada não são reescritas.

`SDR_WHATSAPP`, `TRAFEGO` e `SOCIAL_MEDIA` são marcadores comerciais no
catálogo local. Não entram em `RECURSOS_CONCESSAO`: não autorizam código.

## Trabalho necessário no Control Plane

O Control Plane ainda exige `alunosPorBloco`, `precoPorBlocoCentavos` e
`blocosMinimosPorUnidade`. A evolução recomendada é adicionar, a uma nova
versão imutável de `PlanoVersao`, `tipoCobranca` e `precoFixoCentavos`, mantendo
os campos antigos obrigatórios para as versões existentes. A mensalidade fixa
deve ser por conta, sem multiplicação por unidade nem limite de alunos.

Os contratos em `contracts/` devem ganhar uma versão que carregue o tipo e o
preço fixo se o Control Plane passar a provisionar/exibir essa informação. Não
alterar o schema atual: publicar primeiro consumidores que aceitem ambas as
versões, depois o emissor do Control Plane.

## Ordem segura de deploy

1. Aplicar a migration aditiva e publicar o Tenant Plane consumidor.
2. Criar/versionar os planos no Control Plane e seus contratos, se usados.
3. Publicar o emissor de concessões novo somente após os consumidores.

## Assunções e pendências

- Preço é fixo por conta, ilimitado em alunos e unidades.
- Não foi criado fluxo novo de cadastro: `CreateContaService` já aceita
  `planoId`, mas não está exposto em rota; integrá-lo depende do onboarding
  comercial no Control Plane.
- `alunosGratis` continua no endpoint legado e em seu utilitário para
  compatibilidade; deixou de ser exibido na landing.
