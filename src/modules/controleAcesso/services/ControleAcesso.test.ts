import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { AutorizarAcessoService } from "./AutorizarAcessoService";
import { RegistrarEventoAcessoService } from "./RegistrarEventoAcessoService";
import { obterProvedorAcesso, ProvedorAcessoNaoImplementadoError } from "../providers";
import { criarUnidadeDeTeste } from "../../../shared/testing/criarUnidadeDeTeste";

const autorizar = new AutorizarAcessoService();
const registrar = new RegistrarEventoAcessoService();

const PREFIXO = "TESTE_ACESSO_";

async function limpar() {
  await prisma.eventoAcesso.deleteMany({ where: { unidade: { nome: `${PREFIXO}UNIDADE` } } });
  await prisma.credencialAcesso.deleteMany({ where: { aluno: { nome: { startsWith: PREFIXO } } } });
  await prisma.credencialAcesso.deleteMany({ where: { usuario: { email: { startsWith: "teste_acesso_" } } } });
  await prisma.dispositivoAcesso.deleteMany({ where: { unidade: { nome: `${PREFIXO}UNIDADE` } } });
  await prisma.mensalidade.deleteMany({ where: { aluno: { nome: { startsWith: PREFIXO } } } });
  await prisma.aluno.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
  await prisma.usuario.deleteMany({ where: { email: { startsWith: "teste_acesso_" } } });
  await prisma.unidade.deleteMany({ where: { nome: `${PREFIXO}UNIDADE` } });
}

beforeEach(limpar);
afterAll(limpar);

async function criarCenario() {
  const unidade = await criarUnidadeDeTeste(`${PREFIXO}UNIDADE`);

  const aluno = await prisma.aluno.create({
    data: {
      unidadeId: unidade.id,
      nome: `${PREFIXO}ALUNO`,
      dataNascimento: new Date("2000-01-01"),
      ativo: true,
    },
  });

  const credencial = await prisma.credencialAcesso.create({
    data: { alunoId: aluno.id, tipo: "FACIAL", provedorPessoaId: "eq-123" },
  });

  return { unidade, aluno, credencial };
}

describe("AutorizarAcessoService", () => {
  it("libera aluno ativo e sem pendência", async () => {
    const { credencial, aluno } = await criarCenario();

    const decisao = await autorizar.execute({ credencialId: credencial.id });

    expect(decisao.autorizado).toBe(true);
    expect(decisao.alunoId).toBe(aluno.id);
  });

  it("nega aluno com matrícula inativa", async () => {
    const { credencial, aluno } = await criarCenario();
    await prisma.aluno.update({ where: { id: aluno.id }, data: { ativo: false } });

    const decisao = await autorizar.execute({ credencialId: credencial.id });

    expect(decisao.autorizado).toBe(false);
    expect(decisao.motivo).toContain("inativa");
  });

  it("nega aluno com mensalidade vencida", async () => {
    const { credencial, aluno, unidade } = await criarCenario();

    await prisma.mensalidade.create({
      data: {
        unidadeId: unidade.id,
        alunoId: aluno.id,
        valor: 150,
        vencimento: new Date("2020-01-10"),
        status: "VENCIDA",
      },
    });

    const decisao = await autorizar.execute({ credencialId: credencial.id });

    expect(decisao.autorizado).toBe(false);
    expect(decisao.motivo).toContain("Mensalidade em aberto");
  });

  it("nega credencial revogada e credencial expirada", async () => {
    const { credencial } = await criarCenario();

    await prisma.credencialAcesso.update({ where: { id: credencial.id }, data: { ativo: false } });
    expect((await autorizar.execute({ credencialId: credencial.id })).autorizado).toBe(false);

    await prisma.credencialAcesso.update({
      where: { id: credencial.id },
      data: { ativo: true, validoAte: new Date("2020-01-01") },
    });
    const expirada = await autorizar.execute({ credencialId: credencial.id });

    expect(expirada.autorizado).toBe(false);
    expect(expirada.motivo).toContain("expirada");
  });

  it("nega credencial desconhecida", async () => {
    const decisao = await autorizar.execute({ credencialId: 999999 });

    expect(decisao.autorizado).toBe(false);
    expect(decisao.motivo).toContain("não reconhecida");
  });

  it("sempre libera a saída, mesmo com pendência", async () => {
    const { credencial, aluno, unidade } = await criarCenario();

    await prisma.mensalidade.create({
      data: {
        unidadeId: unidade.id,
        alunoId: aluno.id,
        valor: 150,
        vencimento: new Date("2020-01-10"),
        status: "VENCIDA",
      },
    });

    const decisao = await autorizar.execute({ credencialId: credencial.id, sentido: "SAIDA" });

    expect(decisao.autorizado).toBe(true);
  });
});

describe("RegistrarEventoAcessoService", () => {
  it("grava o evento vindo do equipamento e vincula ao aluno", async () => {
    const { unidade, aluno } = await criarCenario();

    const dispositivo = await prisma.dispositivoAcesso.create({
      data: { unidadeId: unidade.id, nome: `${PREFIXO}CATRACA`, segredoWebhook: "s3gr3d0" },
    });

    // liberação manual: a recepção escolhe a pessoa, então o payload traz o id
    const evento = await registrar.execute({
      dispositivoId: dispositivo.id,
      payload: { origem: "teste", alunoId: aluno.id },
    });

    expect(evento.autorizado).toBe(true);
    expect(evento.alunoId).toBe(aluno.id);
    expect(evento.unidadeId).toBe(unidade.id);

    // o contato com o equipamento fica registrado (monitoramento de catraca offline)
    const atualizado = await prisma.dispositivoAcesso.findUnique({ where: { id: dispositivo.id } });
    expect(atualizado?.ultimoContatoEm).not.toBeNull();
  });

  it("recusa dispositivo inativo", async () => {
    const { unidade } = await criarCenario();

    const dispositivo = await prisma.dispositivoAcesso.create({
      data: { unidadeId: unidade.id, nome: `${PREFIXO}CATRACA`, ativo: false },
    });

    await expect(
      registrar.execute({ dispositivoId: dispositivo.id, payload: {} })
    ).rejects.toThrow("Dispositivo inativo.");
  });
});

describe("providers", () => {
  it("sem provedor configurado cai no manual", () => {
    expect(obterProvedorAcesso(null).nome).toContain("Manual");
    expect(obterProvedorAcesso("MARCA_INEXISTENTE").nome).toContain("Manual");
  });

  it("fabricante conhecido resolve para o provider dele", () => {
    expect(obterProvedorAcesso("CONTROL_ID").nome).toBe("Control iD");
    expect(obterProvedorAcesso("HENRY").nome).toBe("Henry");
  });

  it("fabricante ainda não integrado falha de forma explícita", async () => {
    const provedor = obterProvedorAcesso("CONTROL_ID");

    await expect(
      provedor.sincronizarPessoa({ referenciaExterna: "1", nome: "x", credenciais: [] }, {})
    ).rejects.toBeInstanceOf(ProvedorAcessoNaoImplementadoError);
  });
});
