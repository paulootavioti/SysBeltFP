import { describe, expect, it } from "vitest";
import type { NextFunction, Request, Response } from "express";

import {
  contextoRequisicao,
  definirUsuarioDoContexto,
  obterContextoRequisicao,
} from "./contextoRequisicao";

function requisicaoFalsa(headers: Record<string, string | string[]> = {}, ip?: string) {
  return {
    headers,
    ip,
    socket: { remoteAddress: "127.0.0.1" },
  } as unknown as Request;
}

function rodar(req: Request, acao: () => void) {
  contextoRequisicao(req, {} as Response, acao as unknown as NextFunction);
}

describe("origem da requisição", () => {
  it("pega o IP real do cliente atrás de proxy, não o do proxy", () => {
    // X-Forwarded-For acumula a cadeia: o primeiro é o cliente original.
    const req = requisicaoFalsa({ "x-forwarded-for": "203.0.113.7, 10.0.0.1, 172.16.0.2" }, "10.0.0.1");

    rodar(req, () => {
      expect(obterContextoRequisicao().ip).toBe("203.0.113.7");
    });
  });

  it("cai pro req.ip quando não há proxy na frente", () => {
    rodar(requisicaoFalsa({}, "198.51.100.4"), () => {
      expect(obterContextoRequisicao().ip).toBe("198.51.100.4");
    });
  });

  it("guarda o dispositivo e corta User-Agent absurdamente longo", () => {
    const gigante = "A".repeat(5000);

    rodar(requisicaoFalsa({ "user-agent": gigante }), () => {
      const { dispositivo } = obterContextoRequisicao();

      expect(dispositivo).toHaveLength(255);
    });
  });

  it("sem User-Agent, o dispositivo fica nulo em vez de string vazia", () => {
    rodar(requisicaoFalsa({ "user-agent": "   " }), () => {
      expect(obterContextoRequisicao().dispositivo).toBeNull();
    });
  });
});

describe("usuário autenticado", () => {
  it("fica disponível depois que a autenticação o registra", () => {
    rodar(requisicaoFalsa(), () => {
      expect(obterContextoRequisicao().usuarioId).toBeNull();

      definirUsuarioDoContexto(42);

      expect(obterContextoRequisicao().usuarioId).toBe(42);
    });
  });

  it("não vaza de uma requisição pra outra", () => {
    rodar(requisicaoFalsa({}, "1.1.1.1"), () => definirUsuarioDoContexto(7));

    rodar(requisicaoFalsa({}, "2.2.2.2"), () => {
      expect(obterContextoRequisicao().usuarioId).toBeNull();
      expect(obterContextoRequisicao().ip).toBe("2.2.2.2");
    });
  });

  it("sobrevive a await — o contexto acompanha a cadeia assíncrona", async () => {
    await new Promise<void>((resolve) => {
      rodar(requisicaoFalsa({}, "3.3.3.3"), async () => {
        definirUsuarioDoContexto(99);

        await new Promise((r) => setTimeout(r, 5));

        // é isto que permite o service auditar sem receber req nem
        // usuarioId por parâmetro.
        expect(obterContextoRequisicao().usuarioId).toBe(99);
        expect(obterContextoRequisicao().ip).toBe("3.3.3.3");
        resolve();
      });
    });
  });
});

describe("fora de uma requisição", () => {
  it("devolve campos nulos em vez de estourar", () => {
    // cron, script de manutenção, teste unitário.
    expect(obterContextoRequisicao()).toEqual({ ip: null, dispositivo: null, usuarioId: null });
  });
});
