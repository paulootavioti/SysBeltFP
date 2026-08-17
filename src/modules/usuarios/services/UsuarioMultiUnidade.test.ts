import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { CreateUsuarioService } from "../../auth/services/CreateUsuarioService";
import { UpdateUsuarioService } from "./UpdateUsuarioService";
import { criarUnidadeDeTeste } from "../../../shared/testing/criarUnidadeDeTeste";

let unidadeAId: number;
let unidadeBId: number;
let unidadeCId: number;

async function limpar() {
  await prisma.usuarioUnidade.deleteMany({
    where: { usuario: { email: { startsWith: "teste_multiunidade_" } } },
  });
  await prisma.usuario.deleteMany({ where: { email: { startsWith: "teste_multiunidade_" } } });
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: "TESTE_MULTIUNIDADE_" } } });
}

beforeEach(async () => {
  await limpar();

  const unidadeA = await criarUnidadeDeTeste("TESTE_MULTIUNIDADE_A");
  unidadeAId = unidadeA.id;

  const unidadeB = await criarUnidadeDeTeste("TESTE_MULTIUNIDADE_B");
  unidadeBId = unidadeB.id;

  const unidadeC = await criarUnidadeDeTeste("TESTE_MULTIUNIDADE_C");
  unidadeCId = unidadeC.id;
});
afterAll(limpar);

describe("CreateUsuarioService: vínculo com múltiplas unidades", () => {
  it("cria um vínculo UsuarioUnidade por unidade informada", async () => {
    const usuario = await new CreateUsuarioService().execute({
      nome: "TESTE_MULTIUNIDADE_ADMIN",
      email: "teste_multiunidade_admin@example.com",
      senha: "senha123",
      perfil: "ADMIN",
      unidadeId: unidadeAId,
      unidadeIds: [unidadeAId, unidadeBId],
    });

    expect(usuario.unidadeId).toBe(unidadeAId);

    const vinculos = await prisma.usuarioUnidade.findMany({ where: { usuarioId: usuario.id } });
    expect(vinculos.map((v) => v.unidadeId).sort()).toEqual([unidadeAId, unidadeBId].sort());
  });

  it("sem unidadeIds, cria um único vínculo a partir de unidadeId", async () => {
    const usuario = await new CreateUsuarioService().execute({
      nome: "TESTE_MULTIUNIDADE_RECEPCAO",
      email: "teste_multiunidade_recepcao@example.com",
      senha: "senha123",
      perfil: "RECEPCAO",
      unidadeId: unidadeAId,
    });

    const vinculos = await prisma.usuarioUnidade.findMany({ where: { usuarioId: usuario.id } });
    expect(vinculos).toHaveLength(1);
    expect(vinculos[0].unidadeId).toBe(unidadeAId);
  });

  it("PROFESSOR também pode ser vinculado a mais de uma unidade (dá aula em unidades diferentes)", async () => {
    const usuario = await new CreateUsuarioService().execute({
      nome: "TESTE_MULTIUNIDADE_PROFESSOR",
      email: "teste_multiunidade_professor@example.com",
      senha: "senha123",
      perfil: "PROFESSOR",
      unidadeId: unidadeAId,
      unidadeIds: [unidadeAId, unidadeBId],
    });

    const vinculos = await prisma.usuarioUnidade.findMany({ where: { usuarioId: usuario.id } });
    expect(vinculos.map((v) => v.unidadeId).sort()).toEqual([unidadeAId, unidadeBId].sort());
  });
});

describe("UpdateUsuarioService: troca do conjunto de unidades vinculadas", () => {
  it("substitui os vínculos antigos pelos novos", async () => {
    const usuario = await new CreateUsuarioService().execute({
      nome: "TESTE_MULTIUNIDADE_ADMIN2",
      email: "teste_multiunidade_admin2@example.com",
      senha: "senha123",
      perfil: "ADMIN",
      unidadeId: unidadeAId,
      unidadeIds: [unidadeAId, unidadeBId],
    });

    await new UpdateUsuarioService().execute(
      usuario.id,
      {
        nome: usuario.nome,
        email: usuario.email,
        perfil: "ADMIN",
        unidadeIds: [unidadeCId],
      },
      null
    );

    const vinculos = await prisma.usuarioUnidade.findMany({ where: { usuarioId: usuario.id } });
    expect(vinculos).toHaveLength(1);
    expect(vinculos[0].unidadeId).toBe(unidadeCId);

    const atualizado = await prisma.usuario.findUnique({ where: { id: usuario.id } });
    expect(atualizado?.unidadeId).toBe(unidadeCId);
  });

  it("mantém a unidade ativa quando ela continua entre as vinculadas", async () => {
    const usuario = await new CreateUsuarioService().execute({
      nome: "TESTE_MULTIUNIDADE_ADMIN3",
      email: "teste_multiunidade_admin3@example.com",
      senha: "senha123",
      perfil: "ADMIN",
      unidadeId: unidadeAId,
      unidadeIds: [unidadeAId, unidadeBId],
    });

    await new UpdateUsuarioService().execute(
      usuario.id,
      {
        nome: usuario.nome,
        email: usuario.email,
        perfil: "ADMIN",
        unidadeIds: [unidadeBId, unidadeAId, unidadeCId],
      },
      null
    );

    const atualizado = await prisma.usuario.findUnique({ where: { id: usuario.id } });
    expect(atualizado?.unidadeId).toBe(unidadeAId);
  });

});
