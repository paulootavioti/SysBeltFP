# Coding Standards - Sys Belt

Versão: 2.0

Última atualização: Julho/2026 (documento era um stub truncado — preenchido com as convenções reais usadas no código)

---

## Objetivo

Este documento define os padrões de desenvolvimento adotados no Sys Belt, com base no que já está em uso no código — não é uma aspiração, é o que um módulo novo deve seguir para ficar consistente com os existentes.

---

## Estrutura Backend

Cada módulo de domínio (`alunos`, `turmas`, `aulas`, `financeiro`, etc.) fica em `src/modules/<modulo>/` e segue sempre o mesmo padrão (ver ADR-006):

```txt
src/modules/<modulo>/
├── controller.ts       # <Modulo>Controller — só lê req, chama um Service, devolve res
├── routes.ts            # Router do módulo: monta ensureAuthenticated/ensureRole/validateBody por rota
├── validation.ts        # schemas Zod usados pelo validateBody
└── services/
    ├── CreateXxxService.ts
    ├── ListXxxService.ts
    ├── UpdateXxxService.ts
    └── XxxService.test.ts
```

Código compartilhado entre módulos fica em `src/shared/`:

```txt
src/shared/
├── constants/       # ex.: perfis.ts (PERFIS_MULTI_UNIDADE)
├── database/         # cliente Prisma
├── errors/           # AppError e subclasses
├── middlewares/       # ensureAuthenticated, ensureRole, validateBody
├── testing/           # helpers de fixture para testes
└── utils/             # funções puras (ex.: conflitoHorario.ts, requireUnidadeId.ts)
```

### Controller

- Uma classe `XxxController` por módulo, um método por ação (`create`, `list`, `update`, ...).
- Nunca contém regra de negócio nem acessa o Prisma diretamente — só instancia o Service correspondente, chama `.execute(...)` e devolve a resposta (ver ADR-009).

```ts
export class AlunosController {
  async create(req: Request, res: Response) {
    const service = new CreateAlunoService();
    const aluno = await service.execute({ ...req.body, unidadeId: requireUnidadeId(req) });
    return res.status(201).json(aluno);
  }
}
```

### Service

- Uma classe por ação (`CreateAlunoService`, `ListAlunosService`, `ToggleAlunoAtivoService`...), nunca um Service genérico por módulo.
- Método público único: `execute(...)`.
- Toda regra de negócio, toda chamada ao Prisma e todo `select`/filtro de escopo por unidade (`escopoUnidade`) e por perfil (redação de campos, ver ADR-012) vivem aqui — nunca no Controller nem no frontend.

### Rotas

- Cada rota declara explicitamente `ensureAuthenticated`, depois `ensureRole([...])` quando a ação é restrita a alguns perfis, depois `validateBody(schema)` quando recebe corpo.
- A lista de perfis passada a `ensureRole` é a fonte de verdade de permissão — `acessoPorPerfil.ts` no frontend deve sempre espelhar essa lista (nunca o contrário).

```ts
alunosRoutes.post(
  "/",
  ensureAuthenticated,
  ensureRole(["ADMIN", "RECEPCAO"]),
  validateBody(alunoSchema),
  alunosController.create
);
```

### Validação

- Todo corpo de requisição validado com **Zod**, num schema exportado de `validation.ts` do módulo.
- Campos opcionais que podem vir `null`/`undefined`/ausentes usam `.nullish()`; strings vazias tratadas explicitamente quando o campo aceita `""` como "não informado" (ex.: `email: z.union([z.literal(""), z.string().email()]).nullish()`).

### Nomenclatura (backend)

- Classes: `PascalCase` (`CreateAlunoService`, `AlunosController`).
- Arquivos de Service/Controller: mesmo nome da classe (`CreateAlunoService.ts`).
- Rotas HTTP: sempre em português e no plural (`/alunos`, `/turmas`), alinhado ao nome do módulo.
- Variáveis e funções: `camelCase`.

---

## Estrutura Frontend

```txt
sgcl-web/src/
├── components/
│   ├── layout/     # Layout, SeletorUnidadeAtiva, etc. — usados em toda a aplicação
│   └── ui/          # Design System próprio (ver ADR-005): Button, InfoCard, Modal...
├── modules/
├── shared/          # ApiClient, tipos e utilitários cross-módulo
├── contexts/         # AuthContext, etc.
├── routes/
└── styles/

sgcl-web/src/modules/<modulo>/
├── components/       # componentes usados só dentro deste módulo
├── pages/             # telas roteadas
├── services/          # <Modulo>Service — única camada que chama a API
├── schema/            # schemas Zod usados pelo React Hook Form
├── constants/
├── validators/
├── mappers/
├── utils/
├── hooks/
└── types/
```

### Service (frontend)

- Uma classe `XxxService` por módulo, com métodos estáticos — nenhuma página ou componente chama `axios`/`fetch` diretamente (ver ADR-008).
- Toda chamada passa pelo `ApiClient` compartilhado (`shared/api/ApiClient`), que centraliza tratamento de resposta e erro do Axios.

```ts
export class AlunoService {
  static async listar() {
    return ApiClient.get<Aluno[]>("/alunos");
  }

  static async criar(data: AlunoFormData) {
    return ApiClient.post<Aluno>("/alunos", data);
  }
}
```

### Formulários

- Todo formulário usa **React Hook Form** (`useForm` + `FormProvider`) com validação via **Zod** (`zodResolver`), schema dedicado em `schema/<entidade>.schema.ts` (ver ADR-007).
- O tipo do formulário é inferido do schema (`z.infer<typeof xxxSchema>`), nunca escrito à mão em paralelo.

### Nomenclatura (frontend)

- Componentes e páginas: `PascalCase`, uma pasta por componente com `index.tsx` (+ `.css` quando tiver estilo próprio).
- Arquivos de schema: `camelCase` com sufixo `.schema.ts` (`aluno.schema.ts`).
- Services: `PascalCase` com sufixo `Service` (`AlunoService.ts`).
- Hooks: `camelCase` com prefixo `use` (`useAlunoForm.ts`).

### Controle de acesso no frontend

- `sgcl-web/src/shared/constants/acessoPorPerfil.ts` define quais rotas/menus cada perfil vê — é só uma camada de UX (esconder o que o usuário não pode fazer), nunca a única barreira: o backend sempre revalida via `ensureRole`.
- Dado sensível por perfil (ex.: campos do Aluno para Professor) nunca é escondido só no componente React — o backend já devolve o payload redigido (ver ADR-012). O frontend não deve reimplementar essa lógica de recorte.

---

## Testes

Ver `testes.md` para convenções completas. Resumo:

- Backend: Vitest, testes de integração chamam o Service diretamente contra um Postgres real — sem mock de Prisma, sem Supertest.
- Fixtures de teste sempre usam o prefixo `TESTE_<CONTEXTO>_`, limpas em `beforeEach`/`afterAll`.
- Frontend: Vitest para lógica pura (formatadores, matriz de acesso por perfil).
- Nenhuma mudança é considerada pronta sem `tsc --noEmit`, `vitest run` e (frontend) `eslint`/`build` passando — ver o gate de verificação em `testes.md`.

---

## Erros

- Backend: erros de negócio lançados como `AppError` (`src/shared/errors`), nunca `throw new Error(...)` genérico — o handler central transforma `AppError` em resposta HTTP com status e mensagem apropriados.
- Frontend: erro de API tratado via o mapeador de erro do `ApiClient`, nunca lendo `error.response.data` diretamente em cada página.

---

## Commits e branches

- Mensagens de commit em português, no imperativo, prefixadas por tipo (`feat:`, `fix:`, `docs:`, `refactor:`), refletindo o padrão já usado no histórico do repositório.
- Uma branch por funcionalidade/fase, criada a partir de `main` atualizada; nenhuma mudança de schema (`prisma migrate dev`) fora de uma branch de feature.

---

## Conclusão

Estas convenções existem para que qualquer módulo novo — backend ou frontend — seja reconhecível por quem já conhece os módulos existentes, sem precisar reaprender a estrutura a cada parte do sistema.
