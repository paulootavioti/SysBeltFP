# Testes

Versão do documento: 2.0

Última atualização: Agosto/2026

---

# Estado atual

| Suíte | Arquivos | Testes |
|---|---|---|
| Tenant Plane (`src/`) | 142 | 663 |
| Control Plane (`control-plane/`) | 67 | 188 |
| `sgcl-web` | 9 | 48 |
| `sgcl-portal-familia` | 0 | 0 |
| `sgcl-portal-professor` | 0 | 0 |

Os dois portais **não têm nenhum teste automatizado**. São justamente os
frontends que lidam com dados de menores de idade e com autenticação de
responsáveis. É a maior lacuna de qualidade do repositório e está registrada
no [`roadmap.md`](roadmap.md).

Tudo roda em CI (`.github/workflows/ci.yml`), em jobs separados por
subprojeto, com um PostgreSQL de serviço.

---

# Princípios

**Teste automatizado é parte da entrega, não etapa posterior.** A versão
anterior deste documento dizia que testes manuais eram "a principal estratégia
de validação". Não são mais.

**O teste descreve o comportamento, não a implementação.** Um teste que quebra
ao renomear um método interno, sem que nada tenha mudado para quem usa o
sistema, custa mais do que protege.

**Teste que passa por acidente é pior do que teste ausente**, porque produz
confiança injustificada. Dois casos reais deste projeto:

- Um botão "Dar baixa" ficou fora da área visível de um modal de 600px. O
  Playwright clicou nele mesmo assim e o teste passou. Só a captura de tela
  revelou o problema.
- Um `z.number().int()` aceitava `37.0` como `37` — um plano de R$ 37,00
  passaria a cobrar R$ 0,37. O `int()` valida ser inteiro, não a escala. A
  correção foi um piso explícito (`PISO_CENTAVOS = 100`).

---

# Como rodar

## Preparo, uma vez

```bash
cp .env.test.example .env.test    # ajuste usuário/senha do seu Postgres
npm run test:db:preparar
```

`test:db:preparar` cria o banco da suíte e aplica as migrações.

## Execução

```bash
npm test                          # tudo
npm run test:unit                 # só src/shared
npm run test:integration          # só src/modules

cd control-plane && npm test
cd sgcl-web && npm test
```

O Control Plane usa banco próprio (`control_plane_test`) e
`CONTROL_PLANE_DATABASE_URL`.

---

# A trava do banco

**A suíte apaga registros.** Antes de qualquer coisa, ela verifica que o banco
alvo é local ou tem nome de teste, e aborta se não for.

A escotilha `PERMITIR_TESTE_EM_BANCO_REAL=1` existe para casos conscientes e
imprime aviso explícito. Nunca use contra produção.

```
[testes] o banco "neondb" em ep-....neon.tech não parece ser de teste.
A suíte apaga registros — rodar aqui pode destruir dado real.
```

---

# Falhas fantasma: o Prisma Client desatualizado

Sintoma: dezenas ou centenas de testes falhando com propriedades que
"não existem" no client — `prisma.concessaoPlataforma is undefined`,
`Property 'alunoUnidade' does not exist`.

Causa: o Client foi gerado a partir de um schema anterior.

```bash
npx prisma generate
```

Rode isso **depois de toda mudança de schema e de toda troca de branch**, nos
dois projetos. Esse erro já foi confundido duas vezes com defeito real neste
repositório — uma vez com 298 falhas de tenant, outra com 5 erros de build no
Control Plane. Nos dois casos o código estava correto.

Se a falha for `Can't reach database server at localhost:5432`, o problema é
o Postgres não estar rodando — não é o código.

---

# Níveis

## Unitário

Funções puras e regras isoladas: cálculo de preço, competência, escopo de
unidade, cifra de segredos, parsers.

O motor de preço (`src/modules/plataforma/utils/precoPlataforma.ts`) é o
exemplo do padrão — não lê banco nem relógio, então cada caso é uma chamada
com entrada e saída explícitas.

## Integração

Service contra banco real de teste, com dados criados e limpos pelo próprio
teste. É o nível majoritário do projeto.

## HTTP ponta a ponta

Supertest contra o app Express montado, exercitando middlewares, validação e
autorização junto. Foi assim que o aceite de `37.0` como preço apareceu: o
teste esperava 400 e recebeu 201.

## Arquitetura

Testes que verificam invariantes estruturais, não comportamento.

`src/shared/database/PrismaGlobalArquitetura.test.ts` varre `src/` e falha se
qualquer arquivo de produção importar o Prisma global. Sem ele, um único
`import { prisma }` esquecido reintroduziria vazamento entre academias sem que
nenhum teste funcional acusasse — a falha seria invisível até virar incidente.

## Manual com Playwright

Para verificar o que asserção não pega: recorte, contraste, elemento fora da
área visível, fluxo que trava. Captura de tela faz parte da verificação.

Ao escrever um script, **escope o seletor**. Um `getByRole("combobox")` numa
página com seletor de unidade no cabeçalho pega o do cabeçalho, não o do modal.
Prefira `getByRole("dialog").getByRole(...)`.

---

# O que sempre precisa de teste

- Regra de dinheiro — valor, faixa, arredondamento, vencimento.
- Regra de acesso — quem pode, quem não pode, e o que acontece com perfil
  legado.
- Fronteira de tenant — nenhum caminho pode alcançar dados de outra academia.
- Idempotência — a segunda chamada não pode produzir efeito duplicado.
- Falha fechada — sem segredo, sem concessão, sem contexto: recusa.
- Datas de calendário — a data não pode mudar conforme o fuso de quem consulta.

---

# CI

`.github/workflows/ci.yml` roda, por subprojeto:

```
npm ci → prisma migrate deploy → npm run typecheck → npm test → npm run build
```

`typecheck` e `build` são passos distintos de propósito no Control Plane: o
`build` usa `tsconfig.build.json`, que exclui `**/*.test.ts` para não emitir
arquivo de teste no diretório de functions; o `typecheck` usa o
`tsconfig.json` completo e continua conferindo os tipos dos testes.

A CI dispara em `pull_request`. Push direto em branch, sem PR aberto, **não
dispara** — o que já causou a impressão de que a CI estava desligada.
