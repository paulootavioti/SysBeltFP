import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { CreateResponsavelService } from "./CreateResponsavelService";
import { UpdateResponsavelService } from "./UpdateResponsavelService";
import { ListResponsaveisService } from "./ListResponsaveisService";
import { CreateAlunoService } from "../../alunos/services/CreateAlunoService";
import { UpdateAlunoService } from "../../alunos/services/UpdateAlunoService";
import { LoginFamiliaService } from "../../portalFamilia/services/LoginFamiliaService";

let unidadeId: number;
let alunoId: number;

async function limpar() {
  // criar aluno agora gera consentimento e auditoria — ambos
  // apontam pra unidade e precisam sair antes dela.
  await prisma.consentimento.deleteMany({ where: { unidade: { nome: { startsWith: "TESTE_CREDENCIAIS_" } } } });
  await prisma.auditLog.deleteMany({ where: { unidade: { nome: { startsWith: "TESTE_CREDENCIAIS_" } } } });
  await prisma.responsavel.deleteMany({ where: { nome: { startsWith: "TESTE_CREDENCIAIS_" } } });
  await prisma.aluno.deleteMany({ where: { nome: { startsWith: "TESTE_CREDENCIAIS_" } } });
  await prisma.unidade.deleteMany({ where: { nome: "TESTE_CREDENCIAIS_UNIDADE" } });
}

beforeEach(async () => {
  await limpar();

  const unidade = await prisma.unidade.create({ data: { nome: "TESTE_CREDENCIAIS_UNIDADE" } });
  unidadeId = unidade.id;

  const aluno = await prisma.aluno.create({
    data: {
      unidadeId,
      nome: "TESTE_CREDENCIAIS_ALUNO",
      dataNascimento: new Date("2012-03-10"),
    },
  });
  alunoId = aluno.id;
});
afterAll(limpar);

describe("Geração automática de credenciais do Portal da Família", () => {
  it("CreateResponsavelService gera senha do portal quando há e-mail", async () => {
    const responsavel = await new CreateResponsavelService().execute(
      {
        nome: "TESTE_CREDENCIAIS_RESPONSAVEL",
        parentesco: "Mãe",
        email: "credenciais.responsavel@teste.com",
        alunoId,
      },
      unidadeId
    );

    expect(responsavel.senhaPortalGerada).toBeTruthy();
    expect(typeof responsavel.senhaPortalGerada).toBe("string");
    expect(responsavel.senhaPortalGerada?.length).toBeGreaterThanOrEqual(8);
  });

  it("CreateResponsavelService não gera senha quando não há e-mail", async () => {
    const responsavel = await new CreateResponsavelService().execute(
      {
        nome: "TESTE_CREDENCIAIS_RESPONSAVEL_SEM_EMAIL",
        parentesco: "Pai",
        alunoId,
      },
      unidadeId
    );

    expect(responsavel.senhaPortalGerada).toBeNull();
  });

  it("CreateAlunoService gera senha do portal quando o aluno tem e-mail", async () => {
    const aluno = await new CreateAlunoService().execute({
      unidadeId,
      nome: "TESTE_CREDENCIAIS_ALUNO_COM_EMAIL",
      dataNascimento: "2011-01-01",
      email: "credenciais.aluno@teste.com",
    });

    expect(aluno.senhaPortalGerada).toBeTruthy();
  });

  it("respostas de listagem não expõem o hash da senha do portal", async () => {
    await new CreateResponsavelService().execute(
      {
        nome: "TESTE_CREDENCIAIS_RESPONSAVEL_LISTA",
        parentesco: "Mãe",
        email: "credenciais.lista@teste.com",
        alunoId,
      },
      unidadeId
    );

    const [responsavel] = await new ListResponsaveisService().execute(unidadeId);

    expect(responsavel).not.toHaveProperty("senhaPortal");
  });

  it("UpdateResponsavelService gera senha ao adicionar e-mail que ainda não tinha credencial", async () => {
    const responsavel = await new CreateResponsavelService().execute(
      {
        nome: "TESTE_CREDENCIAIS_RESPONSAVEL_UPDATE",
        parentesco: "Mãe",
        alunoId,
      },
      unidadeId
    );

    expect(responsavel.senhaPortalGerada).toBeNull();

    const atualizado = await new UpdateResponsavelService().execute(
      {
        id: responsavel.id,
        nome: responsavel.nome,
        parentesco: "Mãe",
        email: "credenciais.update@teste.com",
        alunoId,
      },
      unidadeId
    );

    expect(atualizado.senhaPortalGerada).toBeTruthy();
  });

  it("UpdateResponsavelService não regenera senha se o responsável já tinha credencial", async () => {
    const responsavel = await new CreateResponsavelService().execute(
      {
        nome: "TESTE_CREDENCIAIS_RESPONSAVEL_JA_TEM",
        parentesco: "Mãe",
        email: "credenciais.jatem@teste.com",
        alunoId,
      },
      unidadeId
    );

    const atualizado = await new UpdateResponsavelService().execute(
      {
        id: responsavel.id,
        nome: responsavel.nome,
        parentesco: "Mãe",
        email: "credenciais.jatem@teste.com",
        alunoId,
      },
      unidadeId
    );

    expect(atualizado.senhaPortalGerada).toBeNull();
  });

  it("UpdateAlunoService gera senha ao adicionar e-mail que ainda não tinha credencial", async () => {
    const atualizado = await new UpdateAlunoService().execute(
      {
        id: alunoId,
        nome: "TESTE_CREDENCIAIS_ALUNO",
        dataNascimento: "2012-03-10",
        email: "credenciais.aluno.update@teste.com",
      },
      unidadeId
    );

    expect(atualizado.senhaPortalGerada).toBeTruthy();
  });

  it("a senha gerada automaticamente funciona de fato no login do Portal da Família", async () => {
    const email = "credenciais.login@teste.com";

    const responsavel = await new CreateResponsavelService().execute(
      {
        nome: "TESTE_CREDENCIAIS_RESPONSAVEL_LOGIN",
        parentesco: "Mãe",
        email,
        alunoId,
      },
      unidadeId
    );

    const senhaGerada = responsavel.senhaPortalGerada as string;

    const sessao = await new LoginFamiliaService().execute({ email, senha: senhaGerada });

    expect(sessao.usuario.tipo).toBe("RESPONSAVEL");
    expect(sessao.alunos.some((item) => item.id === alunoId)).toBe(true);
  });
});
