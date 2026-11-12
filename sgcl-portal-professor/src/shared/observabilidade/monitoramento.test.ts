import type { ErrorEvent } from "@sentry/react";
import { describe, expect, it } from "vitest";

import { sanitizarBreadcrumb, sanitizarEvento, semQueryString } from "./monitoramento";

describe("monitoramento do navegador", () => {
  it("tira a query string das URLs", () => {
    expect(semQueryString("https://app/redefinir-senha?token=ABC")).toBe("https://app/redefinir-senha");
  });

  it("evento não leva token, cabeçalhos nem usuário", () => {
    const evento = sanitizarEvento({
      type: undefined,
      request: { url: "https://app/redefinir-senha?token=ABC", query_string: "token=ABC", headers: { Authorization: "Bearer x" } },
      user: { email: "pessoa@exemplo.com" },
    } as ErrorEvent);

    expect(JSON.stringify(evento)).not.toMatch(/ABC|Bearer|pessoa@exemplo\.com/);
  });

  it("breadcrumb de navegação e de fetch também", () => {
    const breadcrumb = sanitizarBreadcrumb({ category: "fetch", data: { url: "/api/x?token=ABC", from: "/a?b=1", to: "/c?token=ABC" } });

    expect(JSON.stringify(breadcrumb)).not.toContain("ABC");
  });
});
