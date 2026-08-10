import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { comContextoRequisicao } from "../../../shared/context/contextoRequisicao";
import { RegistrarConsentimentoService } from "./RegistrarConsentimentoService";
import { RevogarConsentimentoService } from "./RevogarConsentimentoService";
import { ConsultarConsentimentoService } from "./ConsultarConsentimentoService";
import { CriarCredencialService } from "../../controleAcesso/services/CriarCredencialService";
import { UpdateAlunoService } from "../../alunos/services/UpdateAlunoService";
import { VERSAO_POLITICA_MIGRADA } from "../constants";
import { criarUnidadeDeTeste } from "../../../shared/testing/criarUnidadeDeTeste";

const registrar = new RegistrarConsentimentoService();
const revogar = new RevogarConsentimentoService();
const consultar = new ConsultarConsentimentoService();
const criarCredencial = new CriarCredencialService();

const PREFIXO = "TESTE_CONSENT_";

async function limpar() {
  await prisma.credencialAcesso.deleteMany({ where: { aluno: { nome: { startsWith: PREFIXO } } } });
  await prisma.auditLog.deleteMany({ where: { unidade: { nome: { startsWith: PREFIXO } } } });
  await prisma.consentimento.deleteMany({ where: { unidade: { nome: { startsWith: PREFIXO } } } });
  await prisma.responsavel.deleteMany({ where: { aluno: { nome: { startsWith: PREFIXO } } } });
  await prisma.aluno.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
  await prisma.usuario.deleteMany({ where: { email: { startsWith: "teste_consent_" } } });
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
}

beforeEach(limpar);
afterAll(limpar);

async function criarCenario() {
  const unidade = await criarUnidadeDeTeste(`${PREFIXO}UNIDADE`);

  const aluno = await prisma.aluno.create({
    data: {
      unidadeId: unidade.id,
      nome: `${PREFIXO}ALUNO`,
      dataNascimento: new Date("2015-05-10"),
      autorizaUsoImagem: true,
    },
  });

  const responsavel = await prisma.responsavel.create({
    data: { unidadeId: unidade.id, alunoId: aluno.id, nome: `${PREFIXO}MAE`, parentesco: "Mãe" },
  });

  const usuario = await prisma.usuario.create({
    data: {
      unidadeId: unidade.id,
      nome: `${PREFIXO}RECEP`,
      email: "teste_consent_recep@x.com",
      senha: "x",
      perfil: "RECEPCAO",
    },
  });

  return { unidade, aluno, responsavel, usuario };
}

describe("RegistrarConsentimentoService", () => {
  it("guarda quem consentiu, de onde e a que versão da política", async () => {
    const { unidade, aluno, responsavel, usuario } = await criarCenario();

    const consentimento = await comContextoRequisicao(
      { ip: "200.10.1.5", dispositivo: "Chrome/Android", usuarioId: usuario.id },
      () =>
        registrar.execute(
          { alunoId: aluno.id, tipo: "BIOMETRIA", concedido: true, responsavelId: responsavel.id },
          unidade.id,
          usuario.id
        )
    );

    expect(consentimento.ip).toBe("200.10.1.5");
    expect(consentimento.dispositivo).toBe("Chrome/Android");
    expect(consentimento.responsavelId).toBe(responsavel.id);
    expect(consentimento.registradoPorId).toBe(usuario.id);
    // sem versão da política não dá pra saber A QUE a pessoa consentiu.
    expect(consentimento.versaoPolitica).toBeTruthy();
    expect(consentimento.versaoPolitica).not.toBe(VERSAO_POLITICA_MIGRADA);
  });

  it("recusa responsável que não é responsável por aquele aluno", async () => {
    const { unidade, aluno, usuario } = await criarCenario();

    const outroAluno = await prisma.aluno.create({
      data: {
        unidadeId: unidade.id,
        nome: `${PREFIXO}OUTRO`,
        dataNascimento: new Date("2014-01-01"),
      },
    });

    const alheio = await prisma.responsavel.create({
      data: {
        unidadeId: unidade.id,
        alunoId: outroAluno.id,
        nome: `${PREFIXO}ALHEIO`,
        parentesco: "Pai",
      },
    });

    await expect(
      registrar.execute(
        { alunoId: aluno.id, tipo: "USO_IMAGEM", concedido: true, responsavelId: alheio.id },
        unidade.id,
        usuario.id
      )
    ).rejects.toThrow(/não é responsável por este aluno/i);
  });

  it("mantém o booleano do aluno em sincronia com o livro de registro", async () => {
    const { unidade, aluno, usuario } = await criarCenario();

    await registrar.execute(
      { alunoId: aluno.id, tipo: "USO_IMAGEM", concedido: false },
      unidade.id,
      usuario.id
    );

    const depois = await prisma.aluno.findUnique({ where: { id: aluno.id } });
    expect(depois?.autorizaUsoImagem).toBe(false);
  });

  it("deixa rastro na auditoria, com IP", async () => {
    const { unidade, aluno, usuario } = await criarCenario();

    await comContextoRequisicao(
      { ip: "10.0.0.9", dispositivo: "Safari", usuarioId: usuario.id },
      () =>
        registrar.execute(
          { alunoId: aluno.id, tipo: "DADOS_SAUDE", concedido: true },
          unidade.id,
          usuario.id
        )
    );

    const log = await prisma.auditLog.findFirst({
      where: { entidade: "Consentimento", operacao: "CONSENTIMENTO" },
      orderBy: { id: "desc" },
    });

    expect(log?.ip).toBe("10.0.0.9");
    expect(log?.dispositivo).toBe("Safari");
    expect(log?.usuarioId).toBe(usuario.id);
  });
});

describe("ConsultarConsentimentoService", () => {
  it("sem nenhum registro, o consentimento não é presumido", async () => {
    const { aluno } = await criarCenario();

    const situacao = await consultar.situacaoAtual(aluno.id, "BIOMETRIA");

    expect(situacao.concedido).toBe(false);
  });

  it("vale sempre o registro mais recente", async () => {
    const { unidade, aluno, usuario } = await criarCenario();

    await registrar.execute(
      { alunoId: aluno.id, tipo: "COMUNICACOES", concedido: true },
      unidade.id,
      usuario.id
    );
    await registrar.execute(
      { alunoId: aluno.id, tipo: "COMUNICACOES", concedido: false },
      unidade.id,
      usuario.id
    );

    expect((await consultar.situacaoAtual(aluno.id, "COMUNICACOES")).concedido).toBe(false);
  });

  it("marca como pendente de recoleta o que veio do backfill", async () => {
    const { unidade, aluno } = await criarCenario();

    await prisma.consentimento.create({
      data: {
        unidadeId: unidade.id,
        alunoId: aluno.id,
        tipo: "USO_IMAGEM",
        concedido: true,
        versaoPolitica: VERSAO_POLITICA_MIGRADA,
      },
    });

    const situacao = await consultar.situacaoAtual(aluno.id, "USO_IMAGEM");

    expect(situacao.concedido).toBe(true);
    expect(situacao.precisaRecoletar).toBe(true);
    // migrado não serve como autorização de verdade.
    expect(await consultar.temConsentimentoValido(aluno.id, "USO_IMAGEM")).toBe(false);
  });
});

describe("RevogarConsentimentoService", () => {
  it("revoga sem apagar a linha e derruba a autorização de imagem", async () => {
    const { unidade, aluno, usuario } = await criarCenario();

    const consentimento = await registrar.execute(
      { alunoId: aluno.id, tipo: "USO_IMAGEM", concedido: true },
      unidade.id,
      usuario.id
    );

    await revogar.execute(consentimento.id, unidade.id, usuario.id);

    const naBase = await prisma.consentimento.findUnique({ where: { id: consentimento.id } });
    expect(naBase).not.toBeNull();
    expect(naBase?.revogadoEm).not.toBeNull();

    const alunoDepois = await prisma.aluno.findUnique({ where: { id: aluno.id } });
    expect(alunoDepois?.autorizaUsoImagem).toBe(false);

    expect((await consultar.situacaoAtual(aluno.id, "USO_IMAGEM")).concedido).toBe(false);
  });

  it("não revoga duas vezes", async () => {
    const { unidade, aluno, usuario } = await criarCenario();

    const consentimento = await registrar.execute(
      { alunoId: aluno.id, tipo: "COMUNICACOES", concedido: true },
      unidade.id,
      usuario.id
    );

    await revogar.execute(consentimento.id, unidade.id, usuario.id);

    await expect(revogar.execute(consentimento.id, unidade.id, usuario.id)).rejects.toThrow(
      /já foi revogado/i
    );
  });
});

describe("credencial biométrica exige consentimento", () => {
  it("recusa cadastro facial sem consentimento de biometria", async () => {
    const { aluno } = await criarCenario();

    await expect(
      criarCredencial.execute({ alunoId: aluno.id, tipo: "FACIAL" })
    ).rejects.toThrow(/consentimento de uso de biometria/i);
  });

  it("recusa também quando o consentimento veio do backfill", async () => {
    const { unidade, aluno } = await criarCenario();

    await prisma.consentimento.create({
      data: {
        unidadeId: unidade.id,
        alunoId: aluno.id,
        tipo: "BIOMETRIA",
        concedido: true,
        versaoPolitica: VERSAO_POLITICA_MIGRADA,
      },
    });

    await expect(
      criarCredencial.execute({ alunoId: aluno.id, tipo: "BIOMETRIA" })
    ).rejects.toThrow(/consentimento de uso de biometria/i);
  });

  it("libera com consentimento válido", async () => {
    const { unidade, aluno, responsavel, usuario } = await criarCenario();

    await registrar.execute(
      { alunoId: aluno.id, tipo: "BIOMETRIA", concedido: true, responsavelId: responsavel.id },
      unidade.id,
      usuario.id
    );

    const credencial = await criarCredencial.execute({ alunoId: aluno.id, tipo: "FACIAL" });

    expect(credencial.id).toBeDefined();
  });

  it("cartão e PIN não são biometria e passam sem consentimento", async () => {
    const { aluno } = await criarCenario();

    expect((await criarCredencial.execute({ alunoId: aluno.id, tipo: "CARTAO" })).id).toBeDefined();
    expect((await criarCredencial.execute({ alunoId: aluno.id, tipo: "PIN" })).id).toBeDefined();
  });

  it("volta a recusar depois que o consentimento é revogado", async () => {
    const { unidade, aluno, usuario } = await criarCenario();

    const consentimento = await registrar.execute(
      { alunoId: aluno.id, tipo: "BIOMETRIA", concedido: true },
      unidade.id,
      usuario.id
    );

    await revogar.execute(consentimento.id, unidade.id, usuario.id);

    await expect(
      criarCredencial.execute({ alunoId: aluno.id, tipo: "FACIAL" })
    ).rejects.toThrow(/consentimento de uso de biometria/i);
  });
});

describe("o cadastro do aluno não escapa do livro de registro", () => {
  // Se a tela de aluno escrevesse `autorizaUsoImagem` direto, o booleano
  // viraria uma segunda fonte da verdade e divergiria do histórico —
  // exatamente o que este módulo existe pra evitar.
  it("mudar a autorização pela tela do aluno gera consentimento rastreável", async () => {
    const { unidade, aluno, usuario } = await criarCenario();

    await comContextoRequisicao(
      { ip: "192.0.2.10", dispositivo: "Firefox", usuarioId: usuario.id },
      () =>
        new UpdateAlunoService().execute(
          { id: aluno.id, nome: aluno.nome, dataNascimento: "2015-05-10", autorizaUsoImagem: false },
          unidade.id
        )
    );

    const registrado = await consultar.situacaoAtual(aluno.id, "USO_IMAGEM");
    expect(registrado.concedido).toBe(false);

    const ultimo = await prisma.consentimento.findFirst({
      where: { alunoId: aluno.id, tipo: "USO_IMAGEM" },
      orderBy: { id: "desc" },
    });
    expect(ultimo?.ip).toBe("192.0.2.10");
    expect(ultimo?.registradoPorId).toBe(usuario.id);

    const alunoDepois = await prisma.aluno.findUnique({ where: { id: aluno.id } });
    expect(alunoDepois?.autorizaUsoImagem).toBe(false);
  });

  it("salvar o cadastro sem mexer na caixa não polui o histórico", async () => {
    const { unidade, aluno, usuario } = await criarCenario();

    const antes = await prisma.consentimento.count({ where: { alunoId: aluno.id } });

    await comContextoRequisicao(
      { ip: "192.0.2.10", dispositivo: "Firefox", usuarioId: usuario.id },
      () =>
        new UpdateAlunoService().execute(
          { id: aluno.id, nome: `${aluno.nome} editado`, dataNascimento: "2015-05-10", autorizaUsoImagem: true },
          unidade.id
        )
    );

    expect(await prisma.consentimento.count({ where: { alunoId: aluno.id } })).toBe(antes);
  });
});
