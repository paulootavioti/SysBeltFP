/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthContext, type AuthContextData, type Usuario } from "../../../contexts/authContextData";
import { SeletorUnidadeAtiva } from ".";

// Três defeitos deste componente passaram por uma suíte verde e só apareceram
// no navegador: ele não renderizava para o DONO, não tinha a opção "todas as
// unidades", e o onChange ignorava o evento quando não achava filial —
// tornando impossível voltar para "todas". Nenhum era pegável fora do DOM.

const { listarMinhasUnidades } = vi.hoisted(() => ({ listarMinhasUnidades: vi.fn() }));

vi.mock("../../../modules/usuarios/services/UsuarioService", () => ({
  UsuarioService: { listarMinhasUnidades },
}));

const MATRIZ = { id: 2, nome: "Alfa Matriz" };
const FILIAL = { id: 3, nome: "Alfa Zona Sul" };

const usuario = (perfil: string, unidadeId: number | null = null): Usuario => ({
  id: 1,
  nome: "Fulana",
  email: "fulana@x.com",
  perfil,
  unidadeId,
  unidadeNome: null,
});

function montar(perfil: string, opcoes = { unidadeId: null as number | null }) {
  const definirUnidadeVisualizada = vi.fn();

  const contexto = {
    usuario: usuario(perfil, opcoes.unidadeId),
    token: "t",
    login: vi.fn(),
    logout: vi.fn(),
    unidadeVisualizada: null,
    definirUnidadeVisualizada,
  } as unknown as AuthContextData;

  render(
    <AuthContext.Provider value={contexto}>
      <SeletorUnidadeAtiva />
    </AuthContext.Provider>
  );

  return { definirUnidadeVisualizada };
}

const seletor = () => screen.queryByRole("combobox");

beforeEach(() => {
  vi.clearAllMocks();
  listarMinhasUnidades.mockResolvedValue([MATRIZ, FILIAL]);
});

// Sem `globals: true` no vitest, o testing-library não registra a limpeza
// automática: um render sobra para o teste seguinte e as buscas por papel
// passam a achar dois seletores.
afterEach(cleanup);

describe("quem vê o seletor", () => {
  // A lista de perfis aqui é cópia da do backend e ficou sem o DONO quando o
  // perfil entrou lá — justamente o único que precisa alternar.
  it.each(["DONO", "ADMIN", "PROFESSOR", "RECEPCAO"])("aparece para %s", async (perfil) => {
    montar(perfil);

    expect(await screen.findByRole("combobox")).toBeDefined();
  });

  it("não aparece para quem tem uma unidade só", async () => {
    listarMinhasUnidades.mockResolvedValue([MATRIZ]);
    montar("ADMIN");

    await waitFor(() => expect(listarMinhasUnidades).toHaveBeenCalled());
    expect(seletor()).toBeNull();
  });

  it("não busca unidades para perfil sem alternância", async () => {
    montar("FAXINA");

    await waitFor(() => expect(seletor()).toBeNull());
    expect(listarMinhasUnidades).not.toHaveBeenCalled();
  });
});

describe("opção 'todas as unidades'", () => {
  // RN-165: só o DONO alcança a academia inteira de uma vez. Para os demais,
  // "todas" seria pedir dados de unidades onde não trabalham.
  it("existe para o DONO", async () => {
    montar("DONO");

    await screen.findByRole("combobox");
    expect(screen.getByRole("option", { name: "Todas as unidades" })).toBeDefined();
  });

  it.each(["ADMIN", "PROFESSOR", "RECEPCAO"])("não existe para %s", async (perfil) => {
    montar(perfil);

    await screen.findByRole("combobox");
    expect(screen.queryByRole("option", { name: "Todas as unidades" })).toBeNull();
  });

  it("o DONO entra nela, sem unidade ativa", async () => {
    montar("DONO");

    expect((await screen.findByRole("combobox")) as HTMLSelectElement).toHaveProperty("value", "");
  });
});

describe("trocar de unidade", () => {
  it("escolher uma filial guarda a filial", async () => {
    const { definirUnidadeVisualizada } = montar("DONO");

    await screen.findByRole("combobox");
    await userEvent.selectOptions(seletor()!, String(FILIAL.id));

    expect(definirUnidadeVisualizada).toHaveBeenCalledWith(FILIAL);
  });

  // Era aqui que o DONO ficava preso: sem filial correspondente o onChange
  // não fazia nada, e não havia como limpar a escolha.
  it("voltar para 'todas' limpa a escolha", async () => {
    const { definirUnidadeVisualizada } = montar("DONO", { unidadeId: FILIAL.id });

    await screen.findByRole("combobox");
    await userEvent.selectOptions(seletor()!, "");

    expect(definirUnidadeVisualizada).toHaveBeenCalledWith(null);
  });

  it("um ADMIN nunca consegue limpar a escolha", async () => {
    const { definirUnidadeVisualizada } = montar("ADMIN", { unidadeId: FILIAL.id });

    await screen.findByRole("combobox");
    await userEvent.selectOptions(seletor()!, String(MATRIZ.id));

    expect(definirUnidadeVisualizada).toHaveBeenCalledWith(MATRIZ);
    expect(definirUnidadeVisualizada).not.toHaveBeenCalledWith(null);
  });
});
