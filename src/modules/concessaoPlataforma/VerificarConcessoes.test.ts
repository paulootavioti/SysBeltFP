import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "../../shared/database/prisma";
import { logger } from "../../shared/observability/logger";
import { VerificarConcessoesService } from "./VerificarConcessoesService";

const PREFIXO = "TESTE_VERIFICAR_CONCESSOES_";
const DIA = 24 * 60 * 60_000;
const agora = new Date("2027-03-10T12:00:00.000Z");

async function limpar() {
  await prisma.concessaoPlataforma.deleteMany({ where: { conta: { nome: { startsWith: PREFIXO } } } });
  await prisma.conta.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
}

async function contaCom(nome: string, statusAcesso: "ATIVO" | "SUSPENSO", expiraEm: Date) {
  const conta = await prisma.conta.create({ data: { nome: `${PREFIXO}${nome}` } });
  await prisma.concessaoPlataforma.create({
    data: {
      contaId: conta.id, tenantKey: conta.tenantKey, statusAcesso, recursos: [], versaoContrato: 1, revisao: 1,
      emitidaEm: new Date(expiraEm.getTime() - 60 * DIA), expiraEm,
      payloadHash: "hash-de-teste", assinaturaBase64: "assinatura-de-teste",
    },
  });
  return conta.id;
}

beforeEach(limpar);
afterAll(limpar);
afterEach(() => vi.restoreAllMocks());

describe("verificação diária das concessões", () => {
  it("avisa as que vencem em até 7 dias e acusa as vencidas sem renovação", async () => {
    const aviso = vi.spyOn(logger, "warn").mockImplementation(() => undefined);
    const erro = vi.spyOn(logger, "error").mockImplementation(() => undefined);
    const vencendo = await contaCom("VENCENDO", "ATIVO", new Date(agora.getTime() + 3 * DIA));
    const vencida = await contaCom("VENCIDA", "ATIVO", new Date(agora.getTime() - DIA));
    const tranquila = await contaCom("TRANQUILA", "ATIVO", new Date(agora.getTime() + 20 * DIA));
    const suspensa = await contaCom("SUSPENSA", "SUSPENSO", new Date(agora.getTime() + DIA));

    const resultado = await new VerificarConcessoesService().execute(agora);

    const contasAvisadas = aviso.mock.calls.filter(([evento]) => evento === "concessao_vencendo").map(([, dados]) => dados?.contaId);
    const contasVencidas = erro.mock.calls.filter(([evento]) => evento === "concessao_vencida").map(([, , dados]) => dados?.contaId);
    expect(contasAvisadas).toContain(vencendo);
    expect(contasVencidas).toContain(vencida);
    expect([...contasAvisadas, ...contasVencidas]).not.toContain(tranquila);
    // suspensa é decisão do Control Plane, não falha de renovação
    expect([...contasAvisadas, ...contasVencidas]).not.toContain(suspensa);
    expect(resultado.vencendo).toBeGreaterThanOrEqual(1);
    expect(resultado.vencidas).toBeGreaterThanOrEqual(1);
  });
});
