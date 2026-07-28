import { describe, expect, it } from "vitest";

import { perfilTemAcesso } from "./acessoPorPerfil";

describe("perfilTemAcesso", () => {
  it("ADMIN tem acesso ao Dashboard", () => {
    expect(perfilTemAcesso("ADMIN", "/dashboard")).toBe(true);
  });

  it("PROFESSOR não tem acesso ao Dashboard", () => {
    expect(perfilTemAcesso("PROFESSOR", "/dashboard")).toBe(false);
  });

  it("RECEPCAO não tem acesso ao Dashboard", () => {
    expect(perfilTemAcesso("RECEPCAO", "/dashboard")).toBe(false);
  });

  it("PROFESSOR não tem acesso a Mensalidades nem Financeiro", () => {
    expect(perfilTemAcesso("PROFESSOR", "/mensalidades")).toBe(false);
    expect(perfilTemAcesso("PROFESSOR", "/financeiro")).toBe(false);
  });

  it("RECEPCAO tem acesso a Mensalidades, mas não a Financeiro nem Planejamento Pedagógico", () => {
    expect(perfilTemAcesso("RECEPCAO", "/mensalidades")).toBe(true);
    expect(perfilTemAcesso("RECEPCAO", "/financeiro")).toBe(false);
    expect(perfilTemAcesso("RECEPCAO", "/planejamento")).toBe(false);
  });

  it("PROFESSOR não tem acesso a Relatórios, Mensagens nem Unidades/Arenas", () => {
    expect(perfilTemAcesso("PROFESSOR", "/relatorios")).toBe(false);
    expect(perfilTemAcesso("PROFESSOR", "/mensagens")).toBe(false);
    expect(perfilTemAcesso("PROFESSOR", "/unidades")).toBe(false);
  });

  it("todos os perfis têm acesso a Alunos, inclusive sub-rotas", () => {
    expect(perfilTemAcesso("PROFESSOR", "/alunos")).toBe(true);
    expect(perfilTemAcesso("PROFESSOR", "/alunos/42")).toBe(true);
    expect(perfilTemAcesso("PROFESSOR", "/alunos/42/editar")).toBe(true);
    expect(perfilTemAcesso("RECEPCAO", "/alunos/cadastro")).toBe(true);
  });

  it("apenas ADMIN tem acesso a Usuários", () => {
    expect(perfilTemAcesso("ADMIN", "/usuarios")).toBe(true);
    expect(perfilTemAcesso("PROFESSOR", "/usuarios")).toBe(false);
    expect(perfilTemAcesso("RECEPCAO", "/usuarios")).toBe(false);
  });

  it("apenas ADMIN tem acesso a Metas", () => {
    expect(perfilTemAcesso("ADMIN", "/metas")).toBe(true);
    expect(perfilTemAcesso("PROFESSOR", "/metas")).toBe(false);
    expect(perfilTemAcesso("RECEPCAO", "/metas")).toBe(false);
  });

  it("ADMIN e RECEPCAO têm acesso a Campanhas e Seminários (Eventos); PROFESSOR não", () => {
    expect(perfilTemAcesso("ADMIN", "/eventos")).toBe(true);
    expect(perfilTemAcesso("RECEPCAO", "/eventos")).toBe(true);
    expect(perfilTemAcesso("RECEPCAO", "/eventos/novo")).toBe(true);
    expect(perfilTemAcesso("PROFESSOR", "/eventos")).toBe(false);
  });

  it("SUPERADMIN tem acesso irrestrito, inclusive Metas e Eventos", () => {
    expect(perfilTemAcesso("SUPERADMIN", "/metas")).toBe(true);
    expect(perfilTemAcesso("SUPERADMIN", "/eventos")).toBe(true);
  });

  it("sem perfil definido, nenhuma rota com regra é liberada", () => {
    expect(perfilTemAcesso(undefined, "/dashboard")).toBe(false);
    expect(perfilTemAcesso(undefined, "/alunos")).toBe(false);
  });

  it("rota sem regra cadastrada é liberada por padrão", () => {
    expect(perfilTemAcesso("PROFESSOR", "/uma-rota-qualquer")).toBe(true);
  });
});
