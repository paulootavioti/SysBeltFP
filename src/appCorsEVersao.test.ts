import type { AddressInfo } from "node:net";
import type { Server } from "node:http";

import { afterEach, describe, expect, it, vi } from "vitest";

// Sobe o app de verdade numa porta livre: CORS_ORIGIN é lido no carregamento
// do módulo, então cada cenário reimporta o app com o ambiente já definido.
async function subirApp(corsOrigin?: string) {
  vi.resetModules();
  if (corsOrigin === undefined) vi.stubEnv("CORS_ORIGIN", "");
  else vi.stubEnv("CORS_ORIGIN", corsOrigin);
  const { app } = await import("./app");
  const servidor: Server = await new Promise((pronto) => {
    const s = app.listen(0, () => pronto(s));
  });
  const { port } = servidor.address() as AddressInfo;
  return { servidor, base: `http://127.0.0.1:${port}` };
}

async function preflight(base: string, origem: string) {
  const resposta = await fetch(`${base}/health`, {
    method: "OPTIONS",
    headers: { Origin: origem, "Access-Control-Request-Method": "GET" },
  });
  return resposta.headers.get("access-control-allow-origin");
}

let servidor: Server | undefined;

afterEach(async () => {
  await new Promise((fechado) => (servidor ? servidor.close(() => fechado(null)) : fechado(null)));
  servidor = undefined;
  vi.unstubAllEnvs();
});

describe("CORS da API", () => {
  it("libera exatamente as origens configuradas, ignorando espaços", async () => {
    const subido = await subirApp(" https://portalprofessorsysbelt.netlify.app , https://sysbeltportalfamilia.netlify.app");
    servidor = subido.servidor;

    expect(await preflight(subido.base, "https://portalprofessorsysbelt.netlify.app")).toBe("https://portalprofessorsysbelt.netlify.app");
    expect(await preflight(subido.base, "https://sysbeltportalfamilia.netlify.app")).toBe("https://sysbeltportalfamilia.netlify.app");
  });

  it("não libera origem desconhecida", async () => {
    const subido = await subirApp("https://portalprofessorsysbelt.netlify.app");
    servidor = subido.servidor;

    expect(await preflight(subido.base, "https://site-malicioso.example")).toBeNull();
  });

  it("sem CORS_ORIGIN, libera só os frontends locais", async () => {
    const subido = await subirApp();
    servidor = subido.servidor;

    expect(await preflight(subido.base, "http://localhost:5176")).toBe("http://localhost:5176");
    expect(await preflight(subido.base, "https://portalprofessorsysbelt.netlify.app")).toBeNull();
  });
});

describe("GET /version", () => {
  it("diz de qual commit a API saiu", async () => {
    const subido = await subirApp();
    servidor = subido.servidor;

    const corpo = await (await fetch(`${subido.base}/version`)).json();
    expect(corpo).toEqual({ sha: expect.any(String), builtAt: null });
  });
});
