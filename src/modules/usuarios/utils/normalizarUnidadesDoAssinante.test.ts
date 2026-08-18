import { describe, expect, it } from "vitest";

import { normalizarUnidadesDoAssinante } from "./normalizarUnidadesDoAssinante";

// O alcance de quem está cadastrando: as unidades da conta dele.
const DA_CONTA = [3, 4];

describe("vínculos de unidades gerenciados pelo assinante", () => {
  it("normaliza e aceita filiais da mesma academia", async () => {
    await expect(normalizarUnidadesDoAssinante([3, "4", 3], DA_CONTA)).resolves.toEqual([3, 4]);
  });

  it("recusa filial de outro assinante", async () => {
    await expect(normalizarUnidadesDoAssinante([9], DA_CONTA)).rejects.toMatchObject({
      message: "Uma ou mais unidades não pertencem à sua academia.",
      statusCode: 403,
    });
  });

  // Basta uma estranha na lista para recusar a lista inteira: aceitar só as
  // conhecidas gravaria um vínculo diferente do que foi pedido, calado.
  it("recusa a lista inteira quando há uma unidade de fora", async () => {
    await expect(normalizarUnidadesDoAssinante([3, 9], DA_CONTA)).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it("ignora o campo quando ele não foi enviado", async () => {
    await expect(normalizarUnidadesDoAssinante(undefined, DA_CONTA)).resolves.toBeUndefined();
  });

  // Sem alcance não há academia a que atribuir ninguém — recusa em vez de
  // deixar passar uma lista que nada valida.
  it("recusa quem não alcança unidade nenhuma", async () => {
    await expect(normalizarUnidadesDoAssinante([3], [])).rejects.toThrow(
      "Selecione uma unidade ativa."
    );
  });
});
