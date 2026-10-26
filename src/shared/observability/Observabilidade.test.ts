import { EventEmitter } from "node:events";

import type { NextFunction, Request, Response } from "express";
import type { ErrorEvent } from "@sentry/node";
import { afterEach, describe, expect, it, vi } from "vitest";

const monitoramento = vi.hoisted(() => ({ reportarErro: vi.fn(), reportarAlerta: vi.fn() }));
vi.mock("./monitoramento", async (original) => ({ ...(await original<object>()), ...monitoramento }));

import { executarJobAgendado } from "./jobAgendado";
import { logger } from "./logger";
import { iniciarMonitoramento, sanitizarEvento } from "./monitoramento";
import { verificarProntidao } from "./prontidao";
import { registrarRequisicao } from "../middlewares/registrarRequisicao";

afterEach(() => {
  vi.restoreAllMocks();
  monitoramento.reportarErro.mockClear();
  monitoramento.reportarAlerta.mockClear();
});

const silenciar = () => {
  vi.spyOn(console, "info").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
};

describe("envio ao Sentry pelo logger", () => {
  it("todo logger.error vira erro no Sentry", () => {
    silenciar();
    const erro = new Error("falhou");
    logger.error("job_falhou", erro, { job: "x" });
    expect(monitoramento.reportarErro).toHaveBeenCalledWith("job_falhou", erro, { job: "x" });
  });

  it("só os avisos selecionados viram alerta", () => {
    silenciar();
    logger.warn("concessao_vencendo", { contaId: 1 });
    logger.warn("webhook_mercadopago_recusado", { motivo: "x" });
    expect(monitoramento.reportarAlerta).toHaveBeenCalledTimes(1);
    expect(monitoramento.reportarAlerta).toHaveBeenCalledWith("concessao_vencendo", { contaId: 1 });
  });
});

describe("monitoramento", () => {
  it("sem SENTRY_DSN fica desligado", () => {
    expect(iniciarMonitoramento({} as NodeJS.ProcessEnv)).toBe(false);
  });

  it("tira tokens, dados da requisição e do usuário antes de enviar", () => {
    const evento = sanitizarEvento({
      type: undefined,
      message: "falha em postgresql://usuario:senha@host/banco",
      exception: { values: [{ value: "Authorization: Bearer abc.def.ghi" }] },
      request: { headers: { authorization: "Bearer abc" } },
      user: { email: "pessoa@exemplo.com" },
    } as ErrorEvent);

    expect(JSON.stringify(evento)).not.toMatch(/usuario:senha|abc\.def\.ghi|pessoa@exemplo\.com/);
    expect(evento.request).toBeUndefined();
    expect(evento.user).toBeUndefined();
  });
});

describe("requisição lenta", () => {
  function medir(duracaoMs: number) {
    silenciar();
    const agora = vi.spyOn(performance, "now").mockReturnValueOnce(0).mockReturnValueOnce(duracaoMs);
    const res = Object.assign(new EventEmitter(), { statusCode: 200 }) as unknown as Response;
    const req = { method: "GET", originalUrl: "/alunos?busca=x" } as Request;
    registrarRequisicao(req, res, (() => undefined) as NextFunction);
    (res as unknown as EventEmitter).emit("finish");
    agora.mockRestore();
  }

  it("acima de 800 ms vira alerta, com a rota sem query string", () => {
    medir(950);
    expect(monitoramento.reportarAlerta).toHaveBeenCalledWith("requisicao_lenta", expect.objectContaining({ rota: "/alunos", duracaoMs: 950 }));
  });

  it("dentro do limite, só log", () => {
    medir(300);
    expect(monitoramento.reportarAlerta).not.toHaveBeenCalled();
  });
});

describe("prontidão", () => {
  it("banco respondendo: pronto", async () => {
    const resultado = await verificarProntidao({ $queryRaw: vi.fn().mockResolvedValue([1]) } as never);
    expect(resultado).toMatchObject({ pronto: true, banco: "ok" });
  });

  it("banco com erro: indisponível", async () => {
    const resultado = await verificarProntidao({ $queryRaw: vi.fn().mockRejectedValue(new Error("ECONNREFUSED")) } as never);
    expect(resultado).toMatchObject({ pronto: false, banco: "indisponivel" });
  });

  it("banco travado: indisponível pelo timeout, sem pendurar a requisição", async () => {
    const resultado = await verificarProntidao({ $queryRaw: vi.fn().mockReturnValue(new Promise(() => undefined)) } as never, 50);
    expect(resultado).toMatchObject({ pronto: false, banco: "indisponivel" });
  });
});

describe("job agendado", () => {
  it("sucesso: 204 e job_concluido com o resumo", async () => {
    silenciar();
    const info = vi.spyOn(logger, "info");
    const resposta = await executarJobAgendado("teste", async () => ({ enviados: 2 }));
    expect(resposta.status).toBe(204);
    expect(info).toHaveBeenCalledWith("job_concluido", expect.objectContaining({ job: "teste", enviados: 2 }));
  });

  it("falha: 500 e job_falhou no Sentry", async () => {
    silenciar();
    const resposta = await executarJobAgendado("teste", async () => {
      throw new Error("Control Plane fora do ar");
    });
    expect(resposta.status).toBe(500);
    expect(monitoramento.reportarErro).toHaveBeenCalledWith("job_falhou", expect.any(Error), expect.objectContaining({ job: "teste" }));
  });
});
