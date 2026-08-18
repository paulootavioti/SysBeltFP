import type { Request, Response } from "express";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../shared/database/prisma";
import { comContextoRequisicao } from "../../shared/context/contextoRequisicao";
import { AuthController } from "./controller";

// O DONO trabalha sem unidade ativa (RN-164). Todo o cadastro de usuários
// deduzia o alcance de quem cadastra a partir da unidade ATIVA dele — o que
// deixava o DONO sem alcance nenhum e sem conseguir cadastrar ninguém, nos
// dois caminhos: com `unidadeIds` no corpo caía em "Selecione uma unidade
// ativa", e sem, em "Informe a unidade para este usuário".
//
// Estes testes passam pelo controller de propósito: a regra do DONO mora
// nele, e um teste de service não a alcançaria.

const PREFIXO = "TESTE_REGDONO_";
const EMAIL = "teste_regdono_";

const controller = new AuthController();

let matrizId: number;
let filialId: number;
let deOutraAcademiaId: number;

async function limpar() {
  await prisma.usuarioUnidade.deleteMany({
    where: { usuario: { email: { startsWith: EMAIL } } },
  });
  await prisma.usuario.deleteMany({ where: { email: { startsWith: EMAIL } } });
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
  await prisma.conta.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
}

beforeEach(async () => {
  await limpar();

  const alfa = await prisma.conta.create({ data: { nome: `${PREFIXO}Alfa` } });
  const beta = await prisma.conta.create({ data: { nome: `${PREFIXO}Beta` } });

  matrizId = (await prisma.unidade.create({ data: { contaId: alfa.id, nome: `${PREFIXO}Matriz` } })).id;
  filialId = (await prisma.unidade.create({ data: { contaId: alfa.id, nome: `${PREFIXO}Filial` } })).id;
  deOutraAcademiaId = (await prisma.unidade.create({ data: { contaId: beta.id, nome: `${PREFIXO}Beta Matriz` } })).id;
});
afterAll(limpar);

function respostaFalsa() {
  const capturado: { status?: number; corpo?: Record<string, unknown> } = {};

  const res = {
    status(codigo: number) {
      capturado.status = codigo;
      return this;
    },
    json(corpo: Record<string, unknown>) {
      capturado.corpo = corpo;
      return this;
    },
  };

  return { res: res as unknown as Response, capturado };
}

/** Executa o register como o DONO da Alfa — sem unidade ativa. */
function cadastrarComoDono(body: Record<string, unknown>) {
  const { res, capturado } = respostaFalsa();
  const req = { body, user: { id: 1, perfil: "DONO", unidadeId: null } } as unknown as Request;

  return comContextoRequisicao(
    { usuarioId: 1, unidadesDoUsuario: [matrizId, filialId] },
    async () => {
      await controller.register(req, res);
      return capturado;
    }
  );
}

describe("o DONO cadastrando usuários", () => {
  it("cadastra indicando a unidade", async () => {
    const { status, corpo } = await cadastrarComoDono({
      nome: "Recepção",
      email: `${EMAIL}recepcao@x.com`,
      senha: "123456",
      perfil: "RECEPCAO",
      unidadeIds: [filialId],
    });

    expect(status).toBe(201);

    const gravado = await prisma.usuario.findUnique({
      where: { email: `${EMAIL}recepcao@x.com` },
    });

    expect(corpo?.id).toBe(gravado?.id);
    expect(gravado?.unidadeId).toBe(filialId);
  });

  it("exige que ele diga em qual unidade a pessoa trabalha", async () => {
    await expect(
      cadastrarComoDono({
        nome: "Recepção",
        email: `${EMAIL}sem_unidade@x.com`,
        senha: "123456",
        perfil: "RECEPCAO",
      })
    ).rejects.toThrow("Informe a unidade para este usuário.");
  });

  it("não deixa vincular a unidade de outra academia", async () => {
    await expect(
      cadastrarComoDono({
        nome: "Espiã",
        email: `${EMAIL}espia@x.com`,
        senha: "123456",
        perfil: "ADMIN",
        unidadeIds: [deOutraAcademiaId],
      })
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});

describe("um DONO recém-cadastrado", () => {
  it("nasce sem unidade ativa e vinculado à academia inteira", async () => {
    await cadastrarComoDono({
      nome: "Sócio",
      email: `${EMAIL}socio@x.com`,
      senha: "123456",
      perfil: "DONO",
      unidadeIds: [matrizId],
    });

    const socio = await prisma.usuario.findUnique({
      where: { email: `${EMAIL}socio@x.com` },
      include: { unidadesVinculadas: true },
    });

    // Sem unidade ativa é o estado "todas as unidades" do seletor (RN-165):
    // o front deixa de mandar o X-Unidade-Id e a requisição volta ao valor
    // gravado. Gravado com uma filial, ele nunca teria para onde voltar.
    expect(socio?.unidadeId).toBeNull();
    expect(socio?.unidadesVinculadas.map((v) => v.unidadeId).sort()).toEqual(
      [matrizId, filialId].sort()
    );
  });

  it("dispensa indicação de unidade — herda a academia de quem cadastrou", async () => {
    await cadastrarComoDono({
      nome: "Sócia",
      email: `${EMAIL}socia@x.com`,
      senha: "123456",
      perfil: "DONO",
    });

    const socia = await prisma.usuario.findUnique({
      where: { email: `${EMAIL}socia@x.com` },
      include: { unidadesVinculadas: true },
    });

    expect(socia?.unidadeId).toBeNull();
    expect(socia?.unidadesVinculadas).toHaveLength(2);
  });
});
