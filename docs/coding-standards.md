# Coding Standards — Sys Belt

Padrões de desenvolvimento do projeto. O que está aqui não é preferência de
estilo: cada regra existe porque a alternativa já causou, ou causaria, um
defeito concreto.

---

# Convenções que valem em todo o código

## Datas de calendário não são instantes

Data de nascimento, competência de mensalidade e vencimento são **datas de
calendário**, ancoradas em meia-noite UTC e sempre lidas e escritas com
acessores UTC (`getUTCFullYear`, `setUTCHours`, …). Formatação de competência
usa `timeZone: "UTC"`.

Tratar uma data de calendário como instante local faz o dia mudar conforme o
fuso de quem consulta — um aluno nascido em 01/03 aparece nascido em 29/02
para metade do mundo.

## Dinheiro da plataforma é inteiro em centavos

Nada de `Float` no domínio comercial. Os valores são reconciliados com
gateways de pagamento, e deriva de ponto flutuante é inaceitável ali.

O teto de faixas usa aritmética inteira, não `Math.ceil` sobre divisão em
ponto flutuante:

```ts
const blocosNecessarios = Math.floor((alunos + porBloco - 1) / porBloco);
```

Dividir em ponto flutuante pode devolver uma faixa a mais quando a divisão não
é exata em binário — e uma faixa a mais é dinheiro cobrado a mais.

## Validação de escala não é validação de tipo

`z.number().int()` aceita `37.0` como `37`. Um plano criado como "R$ 37,00"
passaria a cobrar R$ 0,37. Quando o campo tem escala (centavos), valide a
escala explicitamente — um piso, um múltiplo, um intervalo.

## Idempotência reserva a chave antes do efeito

Insira a chave num índice único **primeiro**, e só então produza o efeito.
`findFirst` seguido de `create` tem janela de corrida entre a consulta e a
escrita.

A chave identifica o **fato**, não a tentativa:
`mensalidade-123-mensalidade_vencida`. Se identificasse a tentativa, cada
retentativa geraria uma chave nova e o efeito duplicaria.

## Cifra autenticada, não apenas cifra

Segredos usam **AES-256-GCM**, não CBC. O GCM autentica: adulteração falha na
decifragem, em vez de devolver bytes plausíveis que o sistema aceitaria como
válidos.

## Falha fechada, sempre

Sem segredo configurado, nada é aceito. Sem concessão, o recurso é negado. Sem
contexto de tenant (quando obrigatório), a requisição falha. Se o banco não se
identificar como de teste, a suíte aborta.

Recusar por falta de configuração deve ser **ruidoso**, não silencioso —
`autenticarDiretorio` lança quando o segredo não existe, em vez de responder
401, para que ausência de configuração não passe por "sem acesso".

## Nunca adivinhar diante de dados ambíguos

`garantirUnidadesDaMesmaConta` recusa a lista inteira quando ela mistura
contas, em vez de filtrar as válidas. Descartar em silêncio esconderia um
vínculo que o usuário acredita ter criado.

---

# Backend

## Camadas

- **Controller** — traduz HTTP. Valida entrada com Zod, chama o service,
  devolve status e corpo. Não contém regra de negócio.
- **Service** — uma responsabilidade por classe, nome no imperativo:
  `CriarAlunoService`, `ListarTurmasService`, `ObterAssinaturaDaContaService`.
- **Shared** — o que atravessa módulos: `middlewares`, `errors`, `constants`,
  `utils`, `security`, `tenant`, `database`, `context`, `services`, `testing`.

## Acesso ao banco

Todo acesso passa por `prismaDaRequisicao()`. **Nenhum arquivo de produção
importa o client global** — `PrismaGlobalArquitetura.test.ts` varre `src/` e
falha se algum passar a importar.

Regras que valem para uma coleção de entidades ficam num utilitário
compartilhado (`escopoUnidade`, `garantirAcessoUnidade`), nunca replicadas em
cada query.

## Estrutura de módulo

```txt
src/modules/<modulo>/
├── controller.ts
├── routes.ts
├── validation.ts
├── services/
│   ├── CriarXService.ts
│   └── CriarXService.test.ts
└── utils/
```

---

# Frontend

```txt
src/
├── components/
│   ├── layout/
│   └── ui/
├── modules/
├── shared/
├── services/
├── routes/
├── contexts/
└── styles/
```

```txt
modules/<modulo>/
├── components/
├── pages/
├── services/
├── schema/
├── constants/
├── validators/
├── mappers/
├── utils/
├── hooks/
└── types.ts
```

## Permissão precisa existir dos dois lados

O backend autoriza, mas o frontend também decide o que exibe. Um perfil
liberado no backend e ausente de `acessoPorPerfil.ts` resulta em usuário
redirecionado para fora de todas as telas — o backend aceitaria, mas ele nunca
chega lá. Ao criar ou alterar um perfil, atualize os dois lados.

---

# Comentários

Comentário explica **por que**, não **o quê**. O código já diz o que faz.

Bom comentário registra a decisão que não é óbvia a partir do código: por que
aritmética inteira em vez de `Math.ceil`, por que o `verify` do `express.json`
existe, por que `--include=dev` é obrigatório no build.

Comentário que descreve regra que não existe mais é pior que comentário
nenhum, porque é lido como verdade. Ao mudar uma regra, procure os comentários
que a citam.

---

# Testes

Toda entrega inclui teste. Ver [`testes.md`](testes.md) para a estratégia, os
níveis e as armadilhas conhecidas — especialmente o Prisma Client
desatualizado, que produz falhas em massa que não correspondem a defeito
algum.

Sempre precisam de teste: regra de dinheiro, regra de acesso, fronteira de
tenant, idempotência, falha fechada e datas de calendário.
