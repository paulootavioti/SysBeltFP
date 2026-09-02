import { describe, expect, it } from "vitest";
import { prismaDaRequisicao } from "./prismaDaRequisicao";

describe("prismaDaRequisicao", () => {
  it("usa sempre o cliente do banco operacional compartilhado", () => {
    expect(prismaDaRequisicao()).toBe(prismaDaRequisicao());
  });

  it("ignora flags multi-banco descontinuadas", () => {
    process.env.TENANT_RESOLUTION_REQUIRED = "true";
    expect(prismaDaRequisicao()).toBeDefined();
    delete process.env.TENANT_RESOLUTION_REQUIRED;
  });
});
