import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { competenciaDoMes } from "../utils/competencia";
import { contaTemRecurso, unidadeTemRecurso } from "../utils/recursosDoPlano";
import { AlterarAssinaturaPlataformaService } from "./AlterarAssinaturaPlataformaService";
import { ContarAlunosDaContaService } from "./ContarAlunosDaContaService";
import { CreateContaService } from "./CreateContaService";
import { GerarFaturasPlataformaService } from "./GerarFaturasPlataformaService";
import { MarcarFaturaPagaService } from "./MarcarFaturaPagaService";
import { ObterAssinaturaDaContaService } from "./ObterAssinaturaDaContaService";
import { CreatePlanoPlataformaService } from "./PlanosPlataformaService";

const PREFIXO = "TESTE_PLATAFORMA_";

const criarConta = new CreateContaService();
const criarPlano = new CreatePlanoPlataformaService();
const contarAlunos = new ContarAlunosDaContaService();
const gerarFaturas = new GerarFaturasPlataformaService();
const marcarPaga = new MarcarFaturaPagaService();
const obterAssinatura = new ObterAssinaturaDaContaService();
const alterarAssinatura = new AlterarAssinaturaPlataformaService();

async function limpar() {
  const contas = { conta: { nome: { startsWith: PREFIXO } } };

  await prisma.faturaPlataforma.deleteMany({ where: contas });
  await prisma.assinaturaPlataforma.deleteMany({ where: contas });
  await prisma.aluno.deleteMany({ where: { unidade: contas } });
  await prisma.unidade.deleteMany({ where: { conta: { nome: { startsWith: PREFIXO } } } });
  await prisma.conta.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
  await prisma.planoPlataforma.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
}

beforeEach(limpar);
afterAll(limpar);

async function planoEssencial(recursos: string[] = []) {
  return criarPlano.execute({
    nome: `${PREFIXO}Essencial`,
    alunosPorBloco: 10,
    precoPorBlocoCentavos: 3700,
    recursos,
  });
}

async function contaComAlunos(quantidade: number, opcoes: { ativos?: boolean } = {}) {
  const plano = await planoEssencial();

  const { conta } = await criarConta.execute({
    nome: `${PREFIXO}Academia`,
    planoId: plano.id,
    nomePrimeiraUnidade: `${PREFIXO}Matriz`,
  });

  const unidade = await prisma.unidade.findFirstOrThrow({ where: { contaId: conta.id } });

  for (let i = 0; i < quantidade; i++) {
    await prisma.aluno.create({
      data: {
        unidadeId: unidade.id,
        nome: `${PREFIXO}Aluno ${i}`,
        dataNascimento: new Date("2012-01-01"),
        ativo: opcoes.ativos ?? true,
      },
    });
  }

  return { conta, plano, unidade };
}

describe("CreateContaService", () => {
  it("cria conta, primeira unidade e assinatura de uma vez", async () => {
    const plano = await planoEssencial();

    const { conta, assinatura } = await criarConta.execute({
      nome: `${PREFIXO}Academia Central`,
      planoId: plano.id,
      nomePrimeiraUnidade: `${PREFIXO}Matriz`,
    });

    const unidades = await prisma.unidade.findMany({ where: { contaId: conta.id } });

    expect(unidades).toHaveLength(1);
    expect(unidades[0].nome).toBe(`${PREFIXO}Matriz`);
    expect(assinatura.contaId).toBe(conta.id);
  });

  it("sem período de teste, a assinatura já nasce cobrando", async () => {
    const plano = await planoEssencial();

    const { assinatura } = await criarConta.execute({
      nome: `${PREFIXO}Sem Teste`,
      planoId: plano.id,
    });

    expect(assinatura.status).toBe("ATIVA");
    expect(assinatura.fimTesteEm).toBeNull();
  });

  it("com período de teste, começa em TESTE e com prazo marcado", async () => {
    const plano = await planoEssencial();

    const { assinatura } = await criarConta.execute({
      nome: `${PREFIXO}Com Teste`,
      planoId: plano.id,
      diasDeTeste: 14,
    });

    expect(assinatura.status).toBe("TESTE");
    expect(assinatura.fimTesteEm).not.toBeNull();
  });

  it("não deixa conta órfã quando o plano não existe", async () => {
    await expect(
      criarConta.execute({ nome: `${PREFIXO}Fantasma`, planoId: 999999 })
    ).rejects.toThrow(AppError);

    const contas = await prisma.conta.findMany({ where: { nome: `${PREFIXO}Fantasma` } });

    expect(contas).toHaveLength(0);
  });
});

describe("ContarAlunosDaContaService", () => {
  it("soma os alunos de todas as filiais da conta", async () => {
    const { conta } = await contaComAlunos(12);

    // a rede abre uma segunda filial com mais 8 alunos.
    const filial = await prisma.unidade.create({
      data: { contaId: conta.id, nome: `${PREFIXO}Filial` },
    });

    for (let i = 0; i < 8; i++) {
      await prisma.aluno.create({
        data: {
          unidadeId: filial.id,
          nome: `${PREFIXO}Filial Aluno ${i}`,
          dataNascimento: new Date("2010-01-01"),
        },
      });
    }

    expect(await contarAlunos.execute(conta.id)).toBe(20);
  });

  it("não conta aluno desativado", async () => {
    const { conta, unidade } = await contaComAlunos(10);

    await prisma.aluno.updateMany({
      where: { unidadeId: unidade.id, nome: `${PREFIXO}Aluno 0` },
      data: { ativo: false },
    });

    expect(await contarAlunos.execute(conta.id)).toBe(9);
  });

  it("não enxerga aluno de outra conta", async () => {
    const { conta } = await contaComAlunos(5);

    const outroPlano = await criarPlano.execute({
      nome: `${PREFIXO}Outro`,
      alunosPorBloco: 10,
      precoPorBlocoCentavos: 3700,
    });

    const { conta: outraConta } = await criarConta.execute({
      nome: `${PREFIXO}Concorrente`,
      planoId: outroPlano.id,
    });

    const outraUnidade = await prisma.unidade.findFirstOrThrow({
      where: { contaId: outraConta.id },
    });

    await prisma.aluno.create({
      data: {
        unidadeId: outraUnidade.id,
        nome: `${PREFIXO}Aluno da concorrente`,
        dataNascimento: new Date("2011-01-01"),
      },
    });

    expect(await contarAlunos.execute(conta.id)).toBe(5);
    expect(await contarAlunos.execute(outraConta.id)).toBe(1);
  });
});

describe("GerarFaturasPlataformaService", () => {
  it("fatura 50 alunos como 5 faixas de R$ 37,00", async () => {
    const { conta } = await contaComAlunos(50);

    const resultado = await gerarFaturas.execute();

    expect(resultado.geradas).toBe(1);

    const fatura = await prisma.faturaPlataforma.findFirstOrThrow({
      where: { contaId: conta.id },
    });

    expect(fatura.alunosContados).toBe(50);
    expect(fatura.blocos).toBe(5);
    expect(fatura.valorCentavos).toBe(18500);
  });

  it("rodar o fechamento duas vezes no mesmo mês não cobra duas vezes", async () => {
    const { conta } = await contaComAlunos(23);

    const primeira = await gerarFaturas.execute();
    const segunda = await gerarFaturas.execute();

    expect(primeira.geradas).toBe(1);
    expect(segunda.geradas).toBe(0);
    expect(segunda.jaExistiam).toBe(1);

    const faturas = await prisma.faturaPlataforma.findMany({ where: { contaId: conta.id } });

    expect(faturas).toHaveLength(1);
  });

  it("nem quando duas rodadas do cron caem ao mesmo tempo", async () => {
    const { conta } = await contaComAlunos(15);

    // a trava é o índice único no banco, não uma checagem em memória —
    // por isso duas execuções concorrentes também são seguras.
    await Promise.all([gerarFaturas.execute(), gerarFaturas.execute()]);

    const faturas = await prisma.faturaPlataforma.findMany({ where: { contaId: conta.id } });

    expect(faturas).toHaveLength(1);
  });

  it("não fatura quem está em período de teste", async () => {
    const plano = await planoEssencial();

    await criarConta.execute({
      nome: `${PREFIXO}Em teste`,
      planoId: plano.id,
      diasDeTeste: 30,
    });

    const resultado = await gerarFaturas.execute();

    expect(resultado.geradas).toBe(0);
  });

  it("não fatura assinatura suspensa ou cancelada", async () => {
    const { conta } = await contaComAlunos(30);

    await alterarAssinatura.execute(conta.id, { status: "SUSPENSA" });
    expect((await gerarFaturas.execute()).geradas).toBe(0);

    await alterarAssinatura.execute(conta.id, { status: "CANCELADA" });
    expect((await gerarFaturas.execute()).geradas).toBe(0);
  });

  it("continua faturando quem está inadimplente", async () => {
    const { conta } = await contaComAlunos(10);

    await alterarAssinatura.execute(conta.id, { status: "INADIMPLENTE" });

    expect((await gerarFaturas.execute()).geradas).toBe(1);
  });

  it("usa o preço negociado da assinatura em vez do preço de tabela", async () => {
    const { conta } = await contaComAlunos(100);

    // condição especial: R$ 25,00 por faixa em vez de R$ 37,00.
    await alterarAssinatura.execute(conta.id, { precoPorBlocoCentavos: 2500 });

    await gerarFaturas.execute();

    const fatura = await prisma.faturaPlataforma.findFirstOrThrow({
      where: { contaId: conta.id },
    });

    expect(fatura.blocos).toBe(10);
    expect(fatura.valorCentavos).toBe(25000);
  });

  it("guarda os parâmetros usados, pra fatura antiga não mudar de valor", async () => {
    const { conta, plano } = await contaComAlunos(20);

    await gerarFaturas.execute();

    // meses depois, a tabela sobe.
    await prisma.planoPlataforma.update({
      where: { id: plano.id },
      data: { precoPorBlocoCentavos: 5000 },
    });

    const fatura = await prisma.faturaPlataforma.findFirstOrThrow({
      where: { contaId: conta.id },
    });

    expect(fatura.precoPorBlocoCentavos).toBe(3700);
    expect(fatura.valorCentavos).toBe(7400);
  });

  it("vence no dia configurado, dentro da competência", async () => {
    const { conta } = await contaComAlunos(10);

    await alterarAssinatura.execute(conta.id, { diaVencimento: 5 });
    await gerarFaturas.execute();

    const fatura = await prisma.faturaPlataforma.findFirstOrThrow({
      where: { contaId: conta.id },
    });

    expect(fatura.competencia.toISOString()).toBe(competenciaDoMes().toISOString());
    expect(fatura.vencimento.getUTCDate()).toBe(5);
    expect(fatura.vencimento.getUTCMonth()).toBe(competenciaDoMes().getUTCMonth());
  });
});

describe("MarcarFaturaPagaService", () => {
  it("baixa a fatura e não reescreve a data quando repetido", async () => {
    const { conta } = await contaComAlunos(10);
    await gerarFaturas.execute();

    const fatura = await prisma.faturaPlataforma.findFirstOrThrow({
      where: { contaId: conta.id },
    });

    const paga = await marcarPaga.execute(fatura.id, new Date("2026-08-05T10:00:00Z"));
    expect(paga.status).toBe("PAGA");

    // webhook reenviado / dois cliques: a data original permanece.
    const novamente = await marcarPaga.execute(fatura.id, new Date("2026-09-30T10:00:00Z"));
    expect(novamente.pagaEm?.toISOString()).toBe("2026-08-05T10:00:00.000Z");
  });

  it("tira o assinante da inadimplência quando não sobra fatura vencida", async () => {
    const { conta } = await contaComAlunos(10);
    await alterarAssinatura.execute(conta.id, { diaVencimento: 1, status: "INADIMPLENTE" });
    await gerarFaturas.execute();

    const fatura = await prisma.faturaPlataforma.findFirstOrThrow({
      where: { contaId: conta.id },
    });

    await marcarPaga.execute(fatura.id);

    const assinatura = await prisma.assinaturaPlataforma.findUniqueOrThrow({
      where: { contaId: conta.id },
    });

    expect(assinatura.status).toBe("ATIVA");
  });
});

describe("ObterAssinaturaDaContaService", () => {
  it("mostra a prévia do mês calculada na hora", async () => {
    const { conta } = await contaComAlunos(41);

    const visao = await obterAssinatura.execute(conta.id);

    // 41 alunos ocupam 5 faixas de 10 — arredonda pra cima.
    expect(visao.previaDoMes.alunosContados).toBe(41);
    expect(visao.previaDoMes.blocos).toBe(5);
    expect(visao.previaDoMes.valorCentavos).toBe(18500);
  });

  it("mostra o preço negociado, não o de tabela", async () => {
    const { conta } = await contaComAlunos(10);

    await alterarAssinatura.execute(conta.id, { precoPorBlocoCentavos: 2000 });

    const visao = await obterAssinatura.execute(conta.id);

    expect(visao.plano.precoPorBlocoCentavos).toBe(2000);
    expect(visao.previaDoMes.valorCentavos).toBe(2000);
  });
});

describe("recursos do plano (o que é premium)", () => {
  it("libera só o que o plano contratado inclui", async () => {
    const plano = await criarPlano.execute({
      nome: `${PREFIXO}Premium`,
      alunosPorBloco: 10,
      precoPorBlocoCentavos: 5900,
      recursos: ["WHATSAPP"],
    });

    const { conta } = await criarConta.execute({ nome: `${PREFIXO}Premium Cliente`, planoId: plano.id });

    expect(await contaTemRecurso(conta.id, "WHATSAPP")).toBe(true);
    expect(await contaTemRecurso(conta.id, "CONTROLE_ACESSO")).toBe(false);
  });

  it("plano sem o recurso não libera", async () => {
    const { conta } = await contaComAlunos(10);

    expect(await contaTemRecurso(conta.id, "WHATSAPP")).toBe(false);
  });

  it("assinatura suspensa ou cancelada perde o recurso", async () => {
    const plano = await planoEssencial(["WHATSAPP"]);
    const { conta } = await criarConta.execute({ nome: `${PREFIXO}Suspenso`, planoId: plano.id });

    expect(await contaTemRecurso(conta.id, "WHATSAPP")).toBe(true);

    await alterarAssinatura.execute(conta.id, { status: "SUSPENSA" });
    expect(await contaTemRecurso(conta.id, "WHATSAPP")).toBe(false);
  });

  it("atraso no pagamento NÃO derruba o recurso — só a suspensão derruba", async () => {
    const plano = await planoEssencial(["WHATSAPP"]);
    const { conta } = await criarConta.execute({ nome: `${PREFIXO}Atrasado`, planoId: plano.id });

    await alterarAssinatura.execute(conta.id, { status: "INADIMPLENTE" });

    expect(await contaTemRecurso(conta.id, "WHATSAPP")).toBe(true);
  });

  it("responde a partir da unidade, que é o que os módulos têm em mãos", async () => {
    const plano = await planoEssencial(["CONTROLE_ACESSO"]);
    const { conta } = await criarConta.execute({
      nome: `${PREFIXO}Por Unidade`,
      planoId: plano.id,
      nomePrimeiraUnidade: `${PREFIXO}Unidade Recurso`,
    });

    const unidade = await prisma.unidade.findFirstOrThrow({ where: { contaId: conta.id } });

    expect(await unidadeTemRecurso(unidade.id, "CONTROLE_ACESSO")).toBe(true);
    expect(await unidadeTemRecurso(unidade.id, "WHATSAPP")).toBe(false);
  });

  it("falha fechado quando a conta ou a unidade não existe", async () => {
    expect(await contaTemRecurso(999999, "WHATSAPP")).toBe(false);
    expect(await unidadeTemRecurso(999999, "WHATSAPP")).toBe(false);
  });

  it("recusa recurso escrito errado em vez de aceitar calado", async () => {
    await expect(
      criarPlano.execute({
        nome: `${PREFIXO}Typo`,
        alunosPorBloco: 10,
        precoPorBlocoCentavos: 3700,
        recursos: ["WHATSAP"],
      })
    ).rejects.toThrow(AppError);
  });
});
