// Teste de carga do piloto (k6). Rode pelo wrapper, que recusa produção:
//
//   BASE_URL=... LOGIN_EMAIL=... LOGIN_SENHA=... npm run carga
//
// Variáveis:
//   BASE_URL              obrigatória (ex.: http://localhost:3333 ou https://<homolog>/api)
//   LOGIN_EMAIL/SENHA     usuário ADMIN de teste, sem 2FA (ou TOKEN_DE_TESTE)
//   TURMA_ID              habilita a escrita: cria e apaga aulas programadas nessa turma
//   FORMA_PAGAMENTO_ID    habilita o webhook do Mercado Pago (sem assinatura: mede a recusa)
//   VUS (50) e DURACAO (5m) controlam a carga de leitura
//
// Critério do piloto (docs/prontidao-lancamento.md): menos de 1% de falha
// HTTP e p95 abaixo de 800 ms em cada rota.

import http from "k6/http";
import { check, fail, sleep } from "k6";

const baseUrl = (__ENV.BASE_URL || "").replace(/\/$/, "");
if (!baseUrl) throw new Error("Defina BASE_URL, por exemplo http://localhost:3333");

const VUS = Number(__ENV.VUS || 50);
const DURACAO = __ENV.DURACAO || "5m";
const turmaId = Number(__ENV.TURMA_ID || 0);
const formaPagamentoId = Number(__ENV.FORMA_PAGAMENTO_ID || 0);
const comLogin = Boolean(__ENV.LOGIN_EMAIL && __ENV.LOGIN_SENHA);

const scenarios = {
  leitura: {
    executor: "ramping-vus",
    exec: "leitura",
    stages: [
      { duration: "1m", target: Math.ceil(VUS / 5) },
      { duration: DURACAO, target: VUS },
      { duration: "30s", target: 0 },
    ],
  },
};
// O login custa caro de propósito (bcrypt): ritmo fixo e baixo, como na vida real.
if (comLogin) scenarios.login = { executor: "constant-arrival-rate", exec: "login", rate: 2, timeUnit: "1s", duration: DURACAO, preAllocatedVUs: 5 };
if (turmaId) scenarios.escrita = { executor: "constant-arrival-rate", exec: "escrita", rate: 1, timeUnit: "1s", duration: DURACAO, preAllocatedVUs: 5 };
if (formaPagamentoId) scenarios.webhook = { executor: "constant-arrival-rate", exec: "webhook", rate: 5, timeUnit: "1s", duration: DURACAO, preAllocatedVUs: 5 };

const thresholds = { http_req_failed: ["rate<0.01"] };
for (const rota of ["health", "dashboard", "listagem_alunos", "listagem_aulas", "login", "criar_aula", "apagar_aula", "webhook"]) {
  thresholds[`http_req_duration{rota:${rota}}`] = ["p(95)<800"];
}

export const options = { scenarios, thresholds };

function entrar() {
  return http.post(`${baseUrl}/auth/login`, JSON.stringify({ email: __ENV.LOGIN_EMAIL, senha: __ENV.LOGIN_SENHA }), {
    headers: { "Content-Type": "application/json" },
    tags: { rota: "login" },
  });
}

export function setup() {
  if (__ENV.TOKEN_DE_TESTE) return { token: __ENV.TOKEN_DE_TESTE };
  if (!comLogin) fail("Defina LOGIN_EMAIL e LOGIN_SENHA (ou TOKEN_DE_TESTE).");
  const resposta = entrar();
  const token = resposta.json("token");
  if (resposta.status !== 200 || !token) {
    fail(`Login falhou (${resposta.status}). Use um usuário ADMIN de teste sem 2FA.`);
  }
  return { token };
}

const autenticado = (token, rota) => ({
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  tags: { rota },
});
const ok = (resposta) => resposta.status >= 200 && resposta.status < 300;

export function leitura({ token }) {
  check(http.get(`${baseUrl}/health`, { tags: { rota: "health" } }), { "health 200": ok });
  check(http.get(`${baseUrl}/dashboard`, autenticado(token, "dashboard")), { "dashboard 2xx": ok });
  check(http.get(`${baseUrl}/alunos?pagina=1&porPagina=20`, autenticado(token, "listagem_alunos")), { "alunos 2xx": ok });
  check(http.get(`${baseUrl}/aulas`, autenticado(token, "listagem_aulas")), { "aulas 2xx": ok });
  sleep(1);
}

export function login() {
  check(entrar(), { "login 200": (resposta) => resposta.status === 200 });
}

// Cada iteração cria uma aula programada numa data distante e única e a
// apaga logo em seguida: o banco termina como começou.
export function escrita({ token }) {
  // ~55 anos de datas a partir de 2090: único por VU e iteração, e ainda
  // dentro do formato AAAA-MM-DD (depois do ano 9999 o ISO muda).
  const dia = new Date(Date.UTC(2090, 0, 1) + ((__VU * 1_000 + __ITER) % 20_000) * 86_400_000);
  const criada = http.post(
    `${baseUrl}/aulas/programadas`,
    JSON.stringify({ turmaId, data: dia.toISOString().slice(0, 10), observacoes: "teste de carga k6" }),
    autenticado(token, "criar_aula"),
  );
  if (!check(criada, { "aula criada 201": (resposta) => resposta.status === 201 })) return;
  const apagada = http.del(`${baseUrl}/aulas/programadas/${criada.json("id")}`, null, autenticado(token, "apagar_aula"));
  check(apagada, { "aula apagada 2xx": ok });
}

// Sem assinatura: a API precisa recusar com 401 sem consultar o Mercado
// Pago (assinar de verdade faria cada requisição chamar a API deles).
export function webhook() {
  const resposta = http.post(
    `${baseUrl}/pagamentos/webhook/mercado_pago/${formaPagamentoId}?data.id=1&type=payment`,
    JSON.stringify({ id: Date.now(), type: "payment", data: { id: "1" } }),
    { headers: { "Content-Type": "application/json" }, tags: { rota: "webhook" }, responseCallback: http.expectedStatuses(401) },
  );
  check(resposta, { "webhook sem assinatura 401": (r) => r.status === 401 });
}
