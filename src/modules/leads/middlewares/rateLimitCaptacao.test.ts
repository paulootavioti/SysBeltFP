import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { limparRateLimitCaptacaoParaTestes, rateLimitCaptacaoPorTelefone } from "./rateLimitCaptacao";

describe("rate limit público por telefone", () => {
  beforeEach(limparRateLimitCaptacaoParaTestes);

  it("bloqueia a quarta tentativa mesmo com formatação diferente", () => {
    const next = vi.fn() as NextFunction;
    const status = vi.fn();
    const json = vi.fn();
    status.mockReturnValue({ json });
    const res = { status } as unknown as Response;
    const telefones = ["(11) 99999-0001", "11999990001", "+55 11 99999-0001", "5511999990001"];

    telefones.forEach((telefone) => rateLimitCaptacaoPorTelefone({ body: { telefone } } as Request, res, next));

    expect(next).toHaveBeenCalledTimes(3);
    expect(status).toHaveBeenCalledWith(429);
    expect(json).toHaveBeenCalledWith({ message: "Não foi possível enviar agora. Tente novamente mais tarde." });
  });
});
