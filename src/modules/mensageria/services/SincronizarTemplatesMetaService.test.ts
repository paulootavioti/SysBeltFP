import { describe, expect, it, vi } from "vitest";
import { analisarTemplate, SincronizarTemplatesMetaService } from "./SincronizarTemplatesMetaService";

describe("sincronização de templates", () => {
  it("conta parâmetros do corpo e rejeita mídia dinâmica", () => {
    expect(analisarTemplate([{ type: "BODY", text: "Olá {{1}}, sua aula é {{2}}." }])).toEqual({ textoExibicao: "Olá {{1}}, sua aula é {{2}}.", quantidadeParametros: 2, suportado: true });
    expect(analisarTemplate([{ type: "HEADER", format: "IMAGE" }, { type: "BODY", text: "Olá" }]).suportado).toBe(false);
  });

  it("ativa apenas templates aprovados e desativa os removidos", async () => {
    const tx = { templateMensageria: { updateMany: vi.fn(), upsert: vi.fn() } };
    const db = {
      canalMensageria: { findFirst: vi.fn().mockResolvedValue({ id: 3, unidadeId: 7, tipo: "WHATSAPP", ativo: true, businessAccountId: "waba", tokenRef: "secret" }) },
      $transaction: vi.fn(async (callback: (cliente: typeof tx) => Promise<void>) => callback(tx)),
    };
    const segredos = { obter: vi.fn().mockResolvedValue("token") };
    const meta = { listar: vi.fn().mockResolvedValue([{ id: "meta-1", name: "retomar", language: "pt_BR", status: "APPROVED", category: "UTILITY", components: [{ type: "BODY", text: "Olá {{1}}" }] }, { id: "meta-2", name: "oferta", language: "pt_BR", status: "REJECTED", components: [] }]) };
    const resultado = await new SincronizarTemplatesMetaService(db as never, segredos, meta as never).executar(7, 3);
    expect(resultado).toMatchObject({ encontrados: 2, aprovados: 1 });
    expect(tx.templateMensageria.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ ativo: false }) }));
    expect(tx.templateMensageria.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ nome: "retomar", ativo: true, quantidadeParametros: 1 }) }));
    expect(tx.templateMensageria.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ nome: "oferta", ativo: false }) }));
  });

  it("não consulta outra unidade", async () => {
    const db = { canalMensageria: { findFirst: vi.fn().mockResolvedValue(null) } };
    const meta = { listar: vi.fn() };
    await expect(new SincronizarTemplatesMetaService(db as never, { obter: vi.fn() }, meta as never).executar(8, 3)).rejects.toMatchObject({ statusCode: 404 });
    expect(db.canalMensageria.findFirst).toHaveBeenCalledWith({ where: { id: 3, unidadeId: 8, tipo: "WHATSAPP", ativo: true } });
    expect(meta.listar).not.toHaveBeenCalled();
  });
});
