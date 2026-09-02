import { hash } from "bcryptjs";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { CreateTurmaService } from "../../turmas/services/CreateTurmaService";
import { ListMinhasUnidadesService } from "../../usuarios/services/ListMinhasUnidadesService";
import { CreateUnidadeService } from "./CreateUnidadeService";
import { ToggleAtivoUnidadeService } from "./ToggleAtivoUnidadeService";

const PREFIXO = "TESTE_FLUXO_OPERACIONAL_";

async function limpar() {
  await prisma.turma.deleteMany({ where: { unidade: { nome: { startsWith: PREFIXO } } } });
  await prisma.arena.deleteMany({ where: { unidade: { nome: { startsWith: PREFIXO } } } });
  await prisma.usuarioUnidade.deleteMany({ where: { unidade: { nome: { startsWith: PREFIXO } } } });
  await prisma.usuario.deleteMany({ where: { email: { startsWith: "teste.fluxo.operacional." } } });
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
  await prisma.conta.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
}

beforeEach(limpar);
afterAll(limpar);

async function cenario() {
  const conta = await prisma.conta.create({ data: { nome: `${PREFIXO}Conta` } });
  const matriz = await prisma.unidade.create({ data: { contaId: conta.id, nome: `${PREFIXO}Matriz` } });
  const admin = await prisma.usuario.create({
    data: {
      unidadeId: matriz.id,
      nome: `${PREFIXO}Admin`,
      email: "teste.fluxo.operacional.admin@sysbelt.local",
      senha: await hash("teste123", 8),
      perfil: "ADMIN",
      unidadesVinculadas: { create: { unidadeId: matriz.id } },
    },
  });
  return { conta, matriz, admin };
}

describe("preparação operacional da academia", () => {
  it("vincula ao criador a filial cadastrada", async () => {
    const { conta, admin } = await cenario();

    const filial = await new CreateUnidadeService().execute({
      contaId: conta.id,
      nome: `${PREFIXO}Filial`,
      usuarioCriadorId: admin.id,
    });

    await expect(prisma.usuarioUnidade.findUnique({
      where: { usuarioId_unidadeId: { usuarioId: admin.id, unidadeId: filial.id } },
    })).resolves.not.toBeNull();
  });

  it("não oferece unidade inativa no seletor do usuário", async () => {
    const { conta, admin } = await cenario();
    const filial = await new CreateUnidadeService().execute({
      contaId: conta.id,
      nome: `${PREFIXO}Filial`,
      usuarioCriadorId: admin.id,
    });
    await prisma.unidade.update({ where: { id: filial.id }, data: { ativo: false } });

    const unidades = await new ListMinhasUnidadesService().execute(admin.id);

    expect(unidades.map((unidade) => unidade.id)).not.toContain(filial.id);
  });

  it("impede inativar a última unidade ativa", async () => {
    const { conta, matriz } = await cenario();

    await expect(new ToggleAtivoUnidadeService().execute(matriz.id, conta.id))
      .rejects.toThrow("pelo menos uma unidade ativa");
  });

  it("recusa criar turma com arena de outra unidade", async () => {
    const { conta, matriz } = await cenario();
    const filial = await prisma.unidade.create({
      data: { contaId: conta.id, nome: `${PREFIXO}Filial` },
    });
    const arenaDaFilial = await prisma.arena.create({
      data: { unidadeId: filial.id, nome: `${PREFIXO}Arena` },
    });

    await expect(new CreateTurmaService().execute({
      unidadeId: matriz.id,
      nome: `${PREFIXO}Turma`,
      faixaEtaria: "Adulto",
      diasSemana: [1],
      horarioInicio: "18:00",
      horarioFim: "19:00",
      arenaId: arenaDaFilial.id,
    })).rejects.toThrow("Arena ativa não encontrada nesta unidade");
  });

  it("recusa turma com intervalo de horário inválido", async () => {
    const { matriz } = await cenario();

    await expect(new CreateTurmaService().execute({
      unidadeId: matriz.id,
      nome: `${PREFIXO}Turma`,
      faixaEtaria: "Adulto",
      diasSemana: [1],
      horarioInicio: "19:00",
      horarioFim: "18:00",
    })).rejects.toThrow("posterior ao horário de início");
  });
});
