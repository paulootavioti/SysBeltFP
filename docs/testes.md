# Testes

Versão do documento: 2.0

Última atualização: Agosto/2026

---

# Estado atual

| Suíte | Arquivos | Testes |
|---|---|---|
| Tenant Plane (`src/`) | 148 | 704 |
| Control Plane (`control-plane/`) | 67 | 188 |
| `sgcl-web` | 14 | 91 |
| `control-plane/web` (painel do operador) | 6 | 77 |
| `sgcl-portal-professor` | 6 | 49 |
| `sgcl-portal-familia` | 5 | 42 |

Números contados rodando as suítes, não estimados — se esta tabela divergir do
que `npm test` imprime, ela é que está errada.

Os dois portais saíram do zero em `1.0.0-rc.2`. O que ainda falta é
profundidade de **componente**: fora o `SeletorUnidadeAtiva` no `sgcl-web`, os
frontends são testados só no nível de função, e defeito de tela escapa disso
(ver o nível "Componente" abaixo).

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

## Componente

Componente React montado em jsdom com `@testing-library/react`, consultado
pelo papel do elemento (`getByRole`) e operado como a pessoa opera.

Existe porque uma classe inteira de defeito não é alcançável de outro jeito. O
`SeletorUnidadeAtiva` acumulou três: não renderizava para o `DONO`, não tinha a
opção "todas as unidades", e o `onChange` ignorava o evento quando não achava
filial — deixando o `DONO` preso na última escolhida. Os três passaram por uma
suíte verde e só apareceram no navegador. Nenhum é sobre uma função; todos são
sobre o que a tela mostra e o que o clique faz.

Por enquanto só o `sgcl-web` tem esse nível
(`components/layout/SeletorUnidadeAtiva/index.test.tsx`). Duas convenções, que
existem porque o vitest daqui não roda com `globals: true`:

- O ambiente é declarado **por arquivo**, com `@vitest-environment jsdom` no
  topo. Assim os testes de função continuam em Node, que é mais rápido, e nada
  precisa mudar na configuração.
- A limpeza entre renders é **explícita** (`afterEach(cleanup)`). Sem ela o
  testing-library não desmonta nada sozinho, o render de um teste sobra para o
  seguinte, e as buscas por papel passam a achar dois elementos — falha
  confusa, porque o erro aponta o teste seguinte e não o anterior.

Mock no limite do módulo, não do componente: aqui só `UsuarioService` é
substituído. O contexto de autenticação entra pelo `Provider` de verdade, que é
o que garante que a fiação continua funcionando.

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

`sgcl-web/src/shared/constants/perfis.test.ts` lê o arquivo de perfis do
backend (com `?raw` do Vite) e falha se as duas listas discordarem. Frontend e
API são pacotes npm separados, então a lista de lá é espelhada aqui, e espelho
diverge calado: foi assim que o `DONO` entrou na lista do backend, ficou de
fora da do frontend, e o seletor de unidade sumiu da tela para o único perfil
que precisa dele. Ler fonte de outro projeto não é elegante, mas é o único
ponto onde essa divergência é observável. Se um dia os dois virarem um pacote
compartilhado, o teste sai junto.

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
