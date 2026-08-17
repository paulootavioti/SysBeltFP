# Arquitetura do Sistema

Versão do documento: 2.0

Última atualização: Agosto/2026

---

# Visão geral

O Sys Belt é composto por **dois planos independentes**, cada um com seu
próprio banco, seu próprio deploy e sua própria autenticação.

```
        Operador do SaaS                      Academia assinante
               │                                      │
               ▼                                      ▼
     ┌───────────────────┐                 ┌────────────────────────┐
     │   Control Plane   │                 │      Tenant Plane      │
     │  (control-plane/) │                 │         (src/)         │
     └───────────────────┘                 └────────────────────────┘
               │                                      │
               │  concessão assinada (Ed25519)        │
               ├─────────────────────────────────────►│
               │                                      │
               │  snapshot de contagem de alunos      │
               │◄─────────────────────────────────────┤
               │                                      │
               ▼                                      ▼
      ┌─────────────────┐              ┌──────────────────────────────┐
      │ Banco comercial │              │ Um banco POR ACADEMIA        │
      │   (exclusivo)   │              │ academia-a · academia-b · …  │
      └─────────────────┘              └──────────────────────────────┘
```

A separação existe para que o isolamento entre clientes seja **físico**. Não
há tabela compartilhada entre academias, nem coluna discriminadora dentro de
um banco comum. Um erro de filtro numa query não pode vazar dados de outro
assinante, porque a query sequer alcança outro banco.

A decisão está registrada como ADR-010 em
[`architecture-decisions.md`](architecture-decisions.md).

---

# Por que os planos não consultam o banco um do outro

Seria mais simples o Tenant Plane consultar o banco comercial para saber se a
academia pode usar WhatsApp. Não é o que acontece.

O Control Plane **assina** uma projeção dos recursos contratados com uma chave
Ed25519. O Tenant Plane guarda a concessão e verifica a assinatura localmente,
com a chave pública. Consequências:

- o Tenant Plane funciona mesmo se o Control Plane estiver fora do ar;
- não há consulta cruzada entre bancos no caminho de cada requisição;
- uma concessão adulterada falha na verificação, em vez de conceder acesso;
- revogar exige emitir uma revisão nova — o que torna a revogação um evento
  explícito e auditável, não um efeito colateral de um `UPDATE`.

Implementação: `src/modules/concessaoPlataforma/`.

---

# Tenant Plane

## Camadas

```
        Cliente (React)
              │
        API REST (Axios)
              │
              ▼
        Express (Node.js)
              │
   ┌──────────┼──────────────────────────┐
   ▼          ▼                          ▼
Resolução   Contexto da            Autenticação
de tenant   requisição             (JWT)
   │          │                          │
   └──────────┴──────────┬───────────────┘
                         ▼
                    Controllers
                         │
                      Services
                         │
                Prisma DA REQUISIÇÃO
                         │
                         ▼
              PostgreSQL do tenant
```

## Ordem dos middlewares

A ordem em `src/app.ts` não é acidental:

1. **`/health/tenant-resolution`** é registrado **antes** da resolução, para
   continuar diagnosticável quando a configuração multi-tenant estiver
   incompleta. A resposta contém apenas indicadores booleanos, nunca valores
   de segredo.
2. **Resolução de tenant** vem antes da autenticação e de qualquer acesso
   operacional ao banco — decidir *qual banco* precede decidir *quem é o
   usuário*.
3. **Contexto da requisição** guarda IP e dispositivo para auditoria e
   consentimentos, sem obrigar cada service a receber `req`.
4. **`express.json` com `verify`** captura os bytes crus do corpo. É a única
   janela para conferir a assinatura do webhook da Meta — depois do parse, o
   corpo original não existe mais.

## O Prisma por requisição

Nenhum arquivo de produção importa o client global. Todo acesso passa por
`prismaDaRequisicao()`:

```ts
export function prismaDaRequisicao() {
  try {
    return prismaDoContexto();
  } catch {
    if (process.env.TENANT_RESOLUTION_REQUIRED === "true") {
      throw new Error("CONTEXTO_TENANT_AUSENTE");
    }
    return prisma;
  }
}
```

O fallback para o client global existe para a fase de transição: enquanto a
resolução está desligada, o sistema opera contra o banco único atual. Quando
`TENANT_RESOLUTION_REQUIRED=true`, o fallback deixa de existir e a ausência de
contexto vira erro — nunca acesso silencioso ao banco errado.

A regra é sustentada por um teste de arquitetura,
`src/shared/database/PrismaGlobalArquitetura.test.ts`, que varre `src/` e falha
se qualquer arquivo de produção importar `database/prisma`. Sem essa guarda, um
único import esquecido reintroduziria vazamento entre academias sem que nenhum
teste funcional acusasse.

## Resolução de tenant

```
Host: academia-a.app.sysbelt.com.br
        │
        ▼
  TenantHostParser        extrai o slug do subdomínio
        │
        ▼
  TenantDirectoryCache    cache com TTL (positivo e negativo)
        │
        ▼
  TenantDirectoryHttp     consulta o Control Plane com segredo compartilhado
        │
        ▼
  TenantSecretProvider    busca a connection string no AWS Secrets Manager
        │
        ▼
  TenantPrismaRegistry    reaproveita clients por tenant, com limite e ociosidade
```

O diretório devolve a **referência** do segredo, nunca a connection string —
ela não trafega pelo Control Plane. O provider confere que a identidade e a
versão do segredo batem com o que o diretório informou; divergência é recusa.

Detalhes: [`resolucao-tenant.md`](resolucao-tenant.md).

---

# Control Plane

Express + Prisma + PostgreSQL, publicado como function serverless no Netlify.

```
control-plane/src/modules/
├── auth · operadores          autenticação e gestão de operadores
├── assinantes · contatos      quem é o cliente
├── planos · assinaturas       o que ele contratou
├── faturas · comercial        quanto e quando
├── concessao                  assina os recursos para o tenant
├── diretorio                  resolve slug → banco (backend-backend)
├── provisionamento            cria e acompanha ambientes de tenant
├── integracao                 recebe snapshots de contagem
├── auditoria · dashboard      rastreabilidade e visão do operador
```

O endpoint do diretório é autenticado por segredo compartilhado no header
`x-sysbelt-directory-secret`, comparado com `timingSafeEqual`. Se o segredo não
estiver configurado, a autenticação **lança** em vez de recusar — falha
fechada e ruidosa, para que a ausência de configuração não passe por engano
como "sem acesso".

---

# Frontends

Três aplicações React separadas consumindo a mesma API:

| App | Porta | Público |
|---|---|---|
| `sgcl-web` | 5173 | Equipe da academia (DONO, ADMIN, PROFESSOR, RECEPCAO) |
| `sgcl-portal-familia` | 5175 | Responsáveis pelos alunos |
| `sgcl-portal-professor` | 5176 | Professor, mobile-first, foco no momento da aula |

São apps distintos, e não rotas do mesmo app, porque os públicos, os fluxos de
autenticação e as restrições de dados são diferentes. O Portal do Professor,
por exemplo, reaproveita o login do `sgcl-web` (o professor já é um `Usuario`),
enquanto o Portal da Família tem credencial própria de responsável.

---

# Padrões do backend

- **Controller** — traduz HTTP: valida entrada com Zod, chama o service,
  devolve status e corpo. Não contém regra de negócio.
- **Service** — uma responsabilidade por classe, nome no imperativo
  (`CriarAlunoService`, `ListarTurmasService`). É onde a regra vive.
- **Shared** — `middlewares`, `errors`, `constants`, `utils`, `security`,
  `tenant`, `database`, `context`, `services`, `testing`.

## Convenções que valem em todo o código

**Datas de calendário são ancoradas em meia-noite UTC** e sempre lidas e
escritas com acessores UTC. Uma data de nascimento ou uma competência de
mensalidade não é um instante — tratá-la como instante local faz o dia mudar
conforme o fuso de quem consulta.

**Dinheiro da plataforma é inteiro em centavos.** Os valores são reconciliados
com gateways de pagamento, onde deriva de ponto flutuante é inaceitável.

**Idempotência reserva a chave antes do efeito** — inserção com índice único
primeiro, não `findFirst` seguido de `create`. A chave identifica o **fato**
(`mensalidade-123-mensalidade_vencida`), não a tentativa.

**Segredos são cifrados com AES-256-GCM**, não CBC: o GCM autentica, então
adulteração falha na decifragem em vez de devolver lixo silenciosamente.

**Falha fechada, sempre.** Sem segredo, nada é aceito; sem concessão, o recurso
é negado; se o banco não for de teste, a suíte aborta.

Detalhes: [`backend.md`](backend.md) e
[`coding-standards.md`](coding-standards.md).

---

# Tecnologias

| Camada | Stack |
|---|---|
| Frontend | React, TypeScript, Vite, React Router, React Hook Form + Zod |
| Backend | Node.js 20, Express 5, Prisma ORM, Zod, JWT |
| Banco | PostgreSQL (Neon em produção) |
| Cofre | AWS Secrets Manager |
| Hospedagem | Netlify (functions serverless) |
| Testes | Vitest, Supertest, GitHub Actions |

Não há SQLite em nenhum ambiente, e não há ambiente de homologação em Docker —
ambos existiram em versões anteriores deste documento e foram descontinuados.
