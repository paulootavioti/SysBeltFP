import http from "k6/http";
import { check, sleep } from "k6";

const baseUrl = (__ENV.BASE_URL || "").replace(/\/$/, "");
const token = __ENV.TOKEN_DE_TESTE || "";

if (!baseUrl) throw new Error("Defina BASE_URL, por exemplo https://api.exemplo.com/api");

export const options = {
  stages: [
    { duration: "1m", target: 10 },
    { duration: "3m", target: 50 },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<800"],
  },
};

const headers = token ? { Authorization: `Bearer ${token}` } : {};

export default function () {
  const health = http.get(`${baseUrl}/health`);
  check(health, { "health responde 200": (res) => res.status === 200 });

  if (token) {
    const dashboard = http.get(`${baseUrl}/dashboard`, { headers });
    check(dashboard, { "dashboard autenticado não falha": (res) => res.status >= 200 && res.status < 300 });
  }

  sleep(1);
}
