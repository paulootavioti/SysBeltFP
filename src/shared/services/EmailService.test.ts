import { afterEach, describe, expect, it, vi } from "vitest";

import { logger } from "../observability/logger";
import { NullEmailService, ResendEmailService, mascararEmail, obterEmailService } from "./EmailService";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("serviço de e-mail", () => {
  it("usa o modo local sem credenciais", () => {
    expect(obterEmailService({} as NodeJS.ProcessEnv)).toBeInstanceOf(NullEmailService);
  });

  it("envia pelo Resend quando as credenciais estão configuradas", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const service = obterEmailService({ RESEND_API_KEY: "chave", EMAIL_FROM: "SysBelt <noreply@exemplo.com>" } as NodeJS.ProcessEnv);

    expect(service).toBeInstanceOf(ResendEmailService);
    await service.enviar("pessoa@exemplo.com", "Assunto", "Corpo");
    expect(fetchMock).toHaveBeenCalledWith("https://api.resend.com/emails", expect.objectContaining({ method: "POST" }));
  });

  it("falha fechado quando o provedor recusa o envio", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 422 }));
    await expect(new ResendEmailService("chave", "origem").enviar("destino", "assunto", "corpo"))
      .rejects.toThrow("EMAIL_PROVIDER_ERROR:422");
  });

  it("modo local nunca registra o corpo nem o e-mail completo", async () => {
    const info = vi.spyOn(logger, "info").mockImplementation(() => undefined);
    const error = vi.spyOn(logger, "error").mockImplementation(() => undefined);

    for (const ambiente of ["development", "production"]) {
      vi.stubEnv("NODE_ENV", ambiente);
      await new NullEmailService().enviar("pessoa@exemplo.com", "Redefinir senha", "https://app/redefinir-senha?token=ABC123");
    }

    const registrado = JSON.stringify([...info.mock.calls, ...error.mock.calls]);
    expect(info).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalledOnce();
    expect(registrado).not.toContain("ABC123");
    expect(registrado).not.toContain("pessoa@exemplo.com");
  });

  it("avisa em produção quando o provedor não está configurado", () => {
    const error = vi.spyOn(logger, "error").mockImplementation(() => undefined);
    expect(obterEmailService({ NODE_ENV: "production" } as NodeJS.ProcessEnv)).toBeInstanceOf(NullEmailService);
    expect(error).toHaveBeenCalledWith("email_provedor_ausente", expect.any(Error));
  });

  it("mascara o destinatário", () => {
    expect(mascararEmail("pessoa@exemplo.com")).toBe("p***@exemplo.com");
  });
});
