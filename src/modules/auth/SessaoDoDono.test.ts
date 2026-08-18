import { hash } from "bcryptjs";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../shared/database/prisma";
import { LoginService } from "./services/LoginService";

// A sessão devolvida no login alimenta o seletor de unidade ativa da tela.
// Para o DONO ela precisa dizer o mesmo que a autenticação faz a cada
// requisição: sem unidade fixa (RN-164).
//
// Um DONO gravado com filial — formato anterior a esta regra — fazia o
// seletor exibir "Alfa Zona Sul" enquanto o resto da tela listava a academia
// inteira. Encontrado olhando a tela, não a suíte.

const PREFIXO = "TESTE_SESSAODONO_";
const EMAIL = "teste_sessaodono_";
const SENHA = "senha-de-teste-123";

let matrizId: number;
let filialId: number;

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

  const conta = await prisma.conta.create({ data: { nome: `${PREFIXO}Alfa` } });

  matrizId = (await prisma.unidade.create({ data: { contaId: conta.id, nome: `${PREFIXO}Matriz` } })).id;
  filialId = (await prisma.unidade.create({ data: { contaId: conta.id, nome: `${PREFIXO}Filial` } })).id;
});
afterAll(limpar);

async function criar(perfil: string, unidadeId: number | null) {
  return prisma.usuario.create({
    data: {
      nome: `${PREFIXO}${perfil}`,
      email: `${EMAIL}${perfil.toLowerCase()}@x.com`,
      senha: await hash(SENHA, 8),
      perfil,
      unidadeId,
      unidadesVinculadas: { create: [{ unidadeId: matrizId }, { unidadeId: filialId }] },
    },
  });
}

describe("sessão devolvida no login", () => {
  it("o DONO entra sem unidade ativa, mesmo com filial gravada", async () => {
    const dono = await criar("DONO", filialId);

    const { usuario } = await new LoginService().execute({ email: dono.email, senha: SENHA });

    expect(usuario.unidadeId).toBeNull();
    expect(usuario.unidadeNome).toBeNull();
  });

  it("os demais perfis entram na unidade deles", async () => {
    const admin = await criar("ADMIN", filialId);

    const { usuario } = await new LoginService().execute({ email: admin.email, senha: SENHA });

    expect(usuario.unidadeId).toBe(filialId);
    expect(usuario.unidadeNome).toBe(`${PREFIXO}Filial`);
  });
});