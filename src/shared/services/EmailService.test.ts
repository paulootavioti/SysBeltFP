import { afterEach, describe, expect, it, vi } from "vitest";

import { NullEmailService, ResendEmailService, obterEmailService } from "./EmailService";

afterEach(() => vi.unstubAllGlobals());

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
});
