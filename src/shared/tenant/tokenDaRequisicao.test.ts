import { describe, expect, it } from "vitest";
import { assinarTokenDaRequisicao, verificarTokenDaRequisicao } from "./tokenDaRequisicao";

const env = { JWT_SECRET: "segredo-de-teste-com-mais-de-trinta-e-dois-caracteres" };

describe("token da requisicao", () => {
  it("assina e valida identidade global no banco compartilhado", () => {
    const token = assinarTokenDaRequisicao({ perfil: "ADMIN" }, { subject: "1", expiresIn: "5m" }, "sysbelt-web", env);
    expect(verificarTokenDaRequisicao(token, "sysbelt-web", env)).toMatchObject({ sub: "1", perfil: "ADMIN" });
  });

  it("nao inclui identificador de conexao", () => {
    const token = assinarTokenDaRequisicao({}, { subject: "1", expiresIn: "5m" }, "sysbelt-web", env);
    expect(verificarTokenDaRequisicao(token, "sysbelt-web", env)).not.toHaveProperty("tenantKey");
  });
});
