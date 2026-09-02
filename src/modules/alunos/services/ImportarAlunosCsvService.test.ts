import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany, execute } = vi.hoisted(() => ({ findMany: vi.fn(), execute: vi.fn() }));
vi.mock("../../../shared/database/prismaDaRequisicao", () => ({
  prismaDaRequisicao: () => ({ turma: { findMany } }),
}));
vi.mock("./CreateAlunoService", () => ({
  CreateAlunoService: class { execute = execute; },
}));

import { ImportarAlunosCsvService } from "./ImportarAlunosCsvService";

describe("importação de alunos por CSV", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findMany.mockResolvedValue([{ id: 8, nome: "Infantil" }]);
    execute.mockImplementation(async (dados) => ({ id: 10, nome: dados.nome, senhaPortalGerada: null }));
  });

  it("aceita CSV com ponto e vírgula, data brasileira e turma por nome", async () => {
    const csv = Buffer.from("nome;data_nascimento;email;turma\nMaria Silva;15/04/2012;maria@exemplo.com;Infantil\n");
    const resultado = await new ImportarAlunosCsvService().execute(csv, 3);

    expect(resultado).toMatchObject({ totalLinhas: 1, totalImportados: 1, totalErros: 0 });
    expect(execute).toHaveBeenCalledWith(expect.objectContaining({
      unidadeId: 3,
      nome: "Maria Silva",
      dataNascimento: "2012-04-15",
      turmaId: 8,
    }));
  });

  it("mantém o lote e relata as linhas inválidas", async () => {
    execute.mockRejectedValueOnce(new Error("Aluno duplicado."));
    const csv = Buffer.from("nome,data_nascimento,turma\nDuplicado,2010-01-01,Infantil\nSem turma,2011-02-02,Inexistente\n");
    const resultado = await new ImportarAlunosCsvService().execute(csv, 3);

    expect(resultado).toMatchObject({ totalLinhas: 2, totalImportados: 0, totalErros: 2 });
    expect(resultado.erros).toEqual([
      expect.objectContaining({ linha: 2, erro: "Aluno duplicado." }),
      expect.objectContaining({ linha: 3, erro: "Turma ativa não encontrada: Inexistente." }),
    ]);
  });
});
