import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { CreateUsuarioService } from "../../auth/services/CreateUsuarioService";
import { UpdateUsuarioService } from "./UpdateUsuarioService";
import { criarUnidadeDeTeste } from "../../../shared/testing/criarUnidadeDeTeste";

// Um usuário sem nenhuma unidade não pertence a conta nenhuma. O escopo por
// conta o trata como quem não alcança nada — o que é a resposta certa em
// segurança, e péssima em produto: a pessoa entra no sistema, vê tudo vazio e
// não há nada na tela dizendo por quê. Melhor não deixar criar.
//
// A trava mora no service, e não só no controller, porque o controller cobre
// um caminho só: script de migração, seed e importação chegam por baixo dele.

const EMAIL = "teste_semunidade_";
const PREFIXO = "TESTE_SEMUNIDADE_";

const criar = new CreateUsuarioService();
const atualizar = new UpdateUsuarioService();

let unidadeId: number;

async function limpar() {
  await prisma.usuarioUnidade.deleteMany({
    where: { usuario: { email: { startsWith: EMAIL } } },
  });
  await prisma.usuario.deleteMany({ where: { email: { startsWith: EMAIL } } });
  await prisma.unidade.deleteMany({ where: { nome: { startsWith: PREFIXO } } });
}

beforeEach(async () => {
  await limpar();
  unidadeId = (await criarUnidadeDeTeste(`${PREFIXO}Matriz`)).id;
});
afterAll(limpar);

describe("cadastro sem unidade", () => {
  it("recusa usuário sem unidade nenhuma", async () => {
    await expect(
      criar.execute({
        nome: "Órfão",
        email: `${EMAIL}orfao@x.com`,
        senha: "123456",
        perfil: "ADMIN",
        unidadeId: null,
      })
    ).rejects.toThrow(AppError);
  });

  it("e não grava nada quando recusa", async () => {
    await criar
      .execute({
        nome: "Órfão",
        email: `${EMAIL}orfao2@x.com`,
        senha: "123456",
        perfil: "ADMIN",
        unidadeId: null,
      })
      .catch(() => undefined);

    expect(await prisma.usuario.findUnique({ where: { email: `${EMAIL}orfao2@x.com` } })).toBeNull();
  });

  it("lista de unidades vazia não conta como unidade", async () => {
    await expect(
      criar.execute({
        nome: "Órfão",
        email: `${EMAIL}orfao3@x.com`,
        senha: "123456",
        perfil: "DONO",
        unidadeId: null,
        unidadeIds: [],
      })
    ).rejects.toThrow(/pelo menos uma unidade/);
  });

  // RN-164: o DONO é o único que trabalha sem unidade ativa. Ele precisa de
  // vínculo, que é de onde sai a conta dele.
  it("aceita DONO sem unidade ativa, desde que vinculado", async () => {
    const dono = await criar.execute({
      nome: "Dona da academia",
      email: `${EMAIL}dono@x.com`,
      senha: "123456",
      perfil: "DONO",
      unidadeId: null,
      unidadeIds: [unidadeId],
    });

    expect(dono.unidadeId).toBeNull();
    expect(await prisma.usuarioUnidade.count({ where: { usuarioId: dono.id } })).toBe(1);
  });

  it("recusa perfil comum sem unidade ativa, mesmo com vínculo", async () => {
    await expect(
      criar.execute({
        nome: "Recepção flutuante",
        email: `${EMAIL}recepcao@x.com`,
        senha: "123456",
        perfil: "RECEPCAO",
        unidadeId: null,
        unidadeIds: [unidadeId],
      })
    ).rejects.toThrow(/sem unidade ativa/);
  });

  it("segue aceitando o caminho normal", async () => {
    const usuario = await criar.execute({
      nome: "Recepção",
      email: `${EMAIL}ok@x.com`,
      senha: "123456",
      perfil: "RECEPCAO",
      unidadeId,
    });

    expect(usuario.unidadeId).toBe(unidadeId);
  });
});

describe("edição não deixa o usuário órfão para trás", () => {
  async function donoSemUnidadeAtiva() {
    return criar.execute({
      nome: "Dona da academia",
      email: `${EMAIL}rebaixar@x.com`,
      senha: "123456",
      perfil: "DONO",
      unidadeId: null,
      unidadeIds: [unidadeId],
    });
  }

  it("recusa rebaixar um DONO sem lhe dar unidade", async () => {
    const dono = await donoSemUnidadeAtiva();

    await expect(
      atualizar.execute(
        dono.id,
        { nome: "Agora admin", email: `${EMAIL}rebaixar@x.com`, perfil: "ADMIN" },
        null
      )
    ).rejects.toThrow(/unidade/);
  });

  it("mas deixa rebaixar quando a edição já traz a unidade", async () => {
    const dono = await donoSemUnidadeAtiva();
    const outra = await criarUnidadeDeTeste(`${PREFIXO}Filial`);

    const atualizado = await atualizar.execute(
      dono.id,
      {
        nome: "Agora admin",
        email: `${EMAIL}rebaixar@x.com`,
        perfil: "ADMIN",
        unidadeIds: [outra.id],
      },
      null
    );

    expect(atualizado.perfil).toBe("ADMIN");
    expect(atualizado.unidadeId).toBe(outra.id);
  });
});
