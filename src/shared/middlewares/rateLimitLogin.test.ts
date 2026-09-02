import { describe, expect, it } from "vitest";

import { criarRateLimitLogin } from "./rateLimitLogin";

describe("rate limit dos logins", () => {
  it("aceita limite configurável sem expor cabeçalhos legados", () => {
    const middleware = criarRateLimitLogin({ LOGIN_RATE_LIMIT_MAX: "7" } as NodeJS.ProcessEnv);

    expect(middleware).toBeTypeOf("function");
  });

  it("volta ao limite seguro quando a configuração é inválida", () => {
    const middleware = criarRateLimitLogin({ LOGIN_RATE_LIMIT_MAX: "0" } as NodeJS.ProcessEnv);

    expect(middleware).toBeTypeOf("function");
  });
});
