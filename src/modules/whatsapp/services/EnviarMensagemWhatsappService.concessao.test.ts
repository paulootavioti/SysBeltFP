import { describe, expect, it, vi } from "vitest";

import { EnviarMensagemWhatsappService } from "./EnviarMensagemWhatsappService";

const entrada = {
  unidadeId: 1,
  template: "LEMBRETE_AULA" as const,
  parametros: ["Joana", "Jiu-Jitsu", "19:00"],
  telefone: null,
  chaveIdempotencia: "aula-1",
};

describe("concessão no envio de WhatsApp", () => {
  it("consulta o recurso do tenant e bloqueia antes das demais validações", async () => {
    const temRecurso = vi.fn().mockResolvedValue(false);
    const resultado = await new EnviarMensagemWhatsappService(temRecurso).execute(entrada);

    expect(temRecurso).toHaveBeenCalledWith("WHATSAPP");
    expect(resultado).toEqual({ resultado: "SEM_RECURSO_NO_PLANO" });
  });

  it("continua o fluxo quando a concessão libera o recurso", async () => {
    const temRecurso = vi.fn().mockResolvedValue(true);
    const resultado = await new EnviarMensagemWhatsappService(temRecurso).execute(entrada);

    expect(resultado).toEqual({ resultado: "SEM_TELEFONE" });
  });
});
