import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { CreateUsuarioService } from "../../auth/services/CreateUsuarioService";
import { UpdateUsuarioService } from "./UpdateUsuarioService";
import { CreateUnidadeService } from "../../unidades/services/CreateUnidadeService";

const PREFIXO = "TESTE_FRONTEIRA_";
const EMAIL = "teste_fronteira_";

const criarUsuario = new CreateUsuarioService();
const atualizarUsuario = new UpdateUsuarioService();
const criarUnidade = new CreateUnidadeService();

async function limpar() {
  await prisma.usuarioUnidade.deleteMany({
    where: { usuario: { email: { startsWith: EMAIL } } },
  });
  await prisma.usuario.deleteMany({ where: { email: { startsWith: EMAIL } } });
  await prisma.unidade.deleteMany({ where: { conta: { nome: { startsWith: PREFIXO } } } });
  await prisma.conta.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
}

beforeEach(limpar);
afterAll(limpar);

async function doisAssinantes() {
  const alfa = await prisma.conta.create({ data: { nome: `${PREFIXO}Alfa` } });
  const beta = await prisma.conta.create({ data: { nome: `${PREFIXO}Beta` } });

  const alfaMatriz = await prisma.unidade.create({
    data: { contaId: alfa.id, nome: `${PREFIXO}Alfa Matriz` },
  });
  const alfaFilial = await prisma.unidade.create({
    data: { contaId: alfa.id, nome: `${PREFIXO}Alfa Filial` },
  });
  const betaMatriz = await prisma.unidade.create({
    data: { contaId: beta.id, nome: `${PREFIXO}Beta Matriz` },
  });

  return { alfa, beta, alfaMatriz, alfaFilial, betaMatriz };
}

async function vinculosDe(usuarioId: number) {
  const vinculos = await prisma.usuarioUnidade.findMany({
    where: { usuarioId },
    select: { unidadeId: true },
  });

  return vinculos.map((v) => v.unidadeId).sort();
}

describe("vínculo não atravessa a fronteira entre assinantes", () => {
  it("recusa vincular um usuário a unidades de contas diferentes", async () => {
    const { alfaMatriz, betaMatriz } = await doisAssinantes();

    // É este o caminho pelo qual alguém enxergaria outro assinante: com
    // vínculo nas duas contas, bastaria trocar a unidade ativa.
    await expect(
      criarUsuario.execute({
        nome: "Espião",
        email: `${EMAIL}espiao@x.com`,
        senha: "123456",
        perfil: "ADMIN",
        unidadeId: alfaMatriz.id,
        unidadeIds: [alfaMatriz.id, betaMatriz.id],
      })
    ).rejects.toThrow(AppError);
  });

  it("e não grava nada quando recusa", async () => {
    const { alfaMatriz, betaMatriz } = await doisAssinantes();

    await criarUsuario
      .execute({
        nome: "Espião",
        email: `${EMAIL}espiao2@x.com`,
        senha: "123456",
        perfil: "ADMIN",
        unidadeId: alfaMatriz.id,
        unidadeIds: [alfaMatriz.id, betaMatriz.id],
      })
      .catch(() => undefined);

    const gravado = await prisma.usuario.findUnique({
      where: { email: `${EMAIL}espiao2@x.com` },
    });

    expect(gravado).toBeNull();
  });

  it("recusa também ao EDITAR um usuário já existente", async () => {
    const { alfaMatriz, alfaFilial, betaMatriz } = await doisAssinantes();

    const usuario = await criarUsuario.execute({
      nome: "Gerente",
      email: `${EMAIL}gerente@x.com`,
      senha: "123456",
      perfil: "ADMIN",
      unidadeId: alfaMatriz.id,
      unidadeIds: [alfaMatriz.id, alfaFilial.id],
    });

    await expect(
      atualizarUsuario.execute(
        usuario.id,
        {
          nome: "Gerente",
          email: `${EMAIL}gerente@x.com`,
          perfil: "ADMIN",
          unidadeIds: [alfaMatriz.id, betaMatriz.id],
        },
        null
      )
    ).rejects.toThrow(/assinantes diferentes/);
  });

  it("recusa unidade inexistente em vez de ignorá-la calado", async () => {
    const { alfaMatriz } = await doisAssinantes();

    await expect(
      criarUsuario.execute({
        nome: "Fantasma",
        email: `${EMAIL}fantasma@x.com`,
        senha: "123456",
        perfil: "ADMIN",
        unidadeId: alfaMatriz.id,
        unidadeIds: [alfaMatriz.id, 999999],
      })
    ).rejects.toThrow(AppError);
  });

  it("aceita normalmente várias filiais da MESMA conta", async () => {
    const { alfaMatriz, alfaFilial } = await doisAssinantes();

    const usuario = await criarUsuario.execute({
      nome: "Gerente Regional",
      email: `${EMAIL}regional@x.com`,
      senha: "123456",
      perfil: "ADMIN",
      unidadeId: alfaMatriz.id,
      unidadeIds: [alfaMatriz.id, alfaFilial.id],
    });

    expect(await vinculosDe(usuario.id)).toEqual([alfaMatriz.id, alfaFilial.id].sort());
  });
});

describe("DONO alcança a academia inteira", () => {
  it("recebe vínculo com todas as filiais, mesmo informando só uma", async () => {
    const { alfaMatriz, alfaFilial } = await doisAssinantes();

    const dono = await criarUsuario.execute({
      nome: "Dono Alfa",
      email: `${EMAIL}dono@x.com`,
      senha: "123456",
      perfil: "DONO",
      unidadeId: alfaMatriz.id,
      unidadeIds: [alfaMatriz.id],
    });

    expect(await vinculosDe(dono.id)).toEqual([alfaMatriz.id, alfaFilial.id].sort());
  });

  it("e nenhuma unidade de outro assinante", async () => {
    const { alfaMatriz, betaMatriz } = await doisAssinantes();

    const dono = await criarUsuario.execute({
      nome: "Dono Alfa",
      email: `${EMAIL}dono2@x.com`,
      senha: "123456",
      perfil: "DONO",
      unidadeId: alfaMatriz.id,
      unidadeIds: [alfaMatriz.id],
    });

    expect(await vinculosDe(dono.id)).not.toContain(betaMatriz.id);
  });

  it("alcança filial aberta DEPOIS dele", async () => {
    const { alfa, alfaMatriz, alfaFilial } = await doisAssinantes();

    const dono = await criarUsuario.execute({
      nome: "Dono Alfa",
      email: `${EMAIL}dono3@x.com`,
      senha: "123456",
      perfil: "DONO",
      unidadeId: alfaMatriz.id,
      unidadeIds: [alfaMatriz.id],
    });

    // a academia cresce: abre a terceira unidade.
    const nova = await criarUnidade.execute({
      nome: `${PREFIXO}Alfa Terceira`,
      contaId: alfa.id,
    });

    // sem isto o dono ficaria sem acesso à própria unidade nova, e o
    // sintoma ("não aparece no seletor") não apontaria pra causa.
    expect(await vinculosDe(dono.id)).toEqual(
      [alfaMatriz.id, alfaFilial.id, nova.id].sort()
    );
  });

  it("abrir filial num assinante não mexe no dono de outro", async () => {
    const { alfa, beta, alfaMatriz, betaMatriz } = await doisAssinantes();

    const donoBeta = await criarUsuario.execute({
      nome: "Dono Beta",
      email: `${EMAIL}donobeta@x.com`,
      senha: "123456",
      perfil: "DONO",
      unidadeId: betaMatriz.id,
      unidadeIds: [betaMatriz.id],
    });

    await criarUnidade.execute({ nome: `${PREFIXO}Alfa Nova`, contaId: alfa.id });

    expect(await vinculosDe(donoBeta.id)).toEqual([betaMatriz.id]);
    expect(alfa.id).not.toBe(beta.id);
    expect(alfaMatriz.id).toBeDefined();
  });

  it("virar DONO por edição também expande o alcance", async () => {
    const { alfaMatriz, alfaFilial } = await doisAssinantes();

    const usuario = await criarUsuario.execute({
      nome: "Sócio",
      email: `${EMAIL}socio@x.com`,
      senha: "123456",
      perfil: "ADMIN",
      unidadeId: alfaMatriz.id,
      unidadeIds: [alfaMatriz.id],
    });

    expect(await vinculosDe(usuario.id)).toEqual([alfaMatriz.id]);

    await atualizarUsuario.execute(
      usuario.id,
      {
        nome: "Sócio",
        email: `${EMAIL}socio@x.com`,
        perfil: "DONO",
        unidadeIds: [alfaMatriz.id],
      },
      null
    );

    expect(await vinculosDe(usuario.id)).toEqual([alfaMatriz.id, alfaFilial.id].sort());
  });
});
