import { describe, expect, it } from "vitest";

import { FonteContagem, GerarSnapshotContagemService } from "./GerarSnapshotContagemService";

describe("emissão da contagem agregada", () => {
  const fonte: FonteContagem = {
    listarUnidades: async () => [
      { id: 1, nome: "Matriz", ativo: true },
      { id: 2, nome: "Filial vazia", ativo: true },
      { id: 3, nome: "Filial encerrada", ativo: false },
    ],
    // O mesmo aluno autorizado em duas unidades já chega contado uma vez em
    // cada vínculo agregado pela fonte.
    contarAlunosAtivos: async () => [
      { unidadeId: 1, _count: { _all: 12 } },
      { unidadeId: 2, _count: { _all: 1 } },
    ],
  };

  it("inclui unidade ativa vazia e encerra inativa com contagem zero", async () => {
    const snapshot = await new GerarSnapshotContagemService(fonte).execute(
      "64d729dc-8cbc-4fbf-9259-f28809faf55d",
      new Date("2026-08-12T03:10:00.000Z"),
    );
    expect(snapshot.unidades).toEqual([
      { unidadeId: "1", nomeExibicao: "Matriz", status: "ATIVA", alunosAtivos: 12 },
      { unidadeId: "2", nomeExibicao: "Filial vazia", status: "ATIVA", alunosAtivos: 1 },
      { unidadeId: "3", nomeExibicao: "Filial encerrada", status: "ENCERRADA", alunosAtivos: 0 },
    ]);
  });

  it("gera o mesmo evento para retentativas no mesmo dia de São Paulo", async () => {
    const service = new GerarSnapshotContagemService(fonte);
    const primeiro = await service.execute("64d729dc-8cbc-4fbf-9259-f28809faf55d", new Date("2026-08-12T04:00:00Z"));
    const segundo = await service.execute("64d729dc-8cbc-4fbf-9259-f28809faf55d", new Date("2026-08-12T20:00:00Z"));
    expect(primeiro.eventoId).toBe(segundo.eventoId);
  });
});
