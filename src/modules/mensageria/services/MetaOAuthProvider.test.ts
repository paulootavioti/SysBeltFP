import { describe, expect, it } from "vitest";
import { MetaOAuthProvider } from "./MetaOAuthProvider";

const segredo = { obter: async () => "app-secret-teste" };

describe("OAuth Meta", () => {
  it("troca o código, valida o app e não devolve o app secret", async () => {
    process.env.META_APP_ID = "app-123";
    process.env.META_APP_SECRET_REF = "cofre/app-secret";
    const chamadas: string[] = [];
    const fetchFn = async (entrada: string | URL | Request) => {
      const url = String(entrada); chamadas.push(url);
      if (url.includes("oauth/access_token")) return new Response(JSON.stringify({ access_token: "token-tenant" }), { status: 200 });
      return new Response(JSON.stringify({ data: { app_id: "app-123", is_valid: true } }), { status: 200 });
    };
    const resposta = await new MetaOAuthProvider(segredo, fetchFn as typeof fetch).trocarCodigo("codigo-curto", "https://app.example/atendimento");
    expect(resposta).toEqual({ token: "token-tenant", appSecretRef: "cofre/app-secret", expiraEm: null });
    expect(chamadas).toHaveLength(2);
  });

  it("rejeita token emitido para outro aplicativo", async () => {
    process.env.META_APP_ID = "app-123";
    process.env.META_APP_SECRET_REF = "cofre/app-secret";
    const fetchFn = async (entrada: string | URL | Request) => String(entrada).includes("oauth/access_token")
      ? new Response(JSON.stringify({ access_token: "token" }), { status: 200 })
      : new Response(JSON.stringify({ data: { app_id: "outro-app", is_valid: true } }), { status: 200 });
    await expect(new MetaOAuthProvider(segredo, fetchFn as typeof fetch).trocarCodigo("codigo", "https://app.example/atendimento")).rejects.toThrow("META_TOKEN_INVALIDO");
  });

  it("assina webhooks somente quando o telefone pertence à WABA", async () => {
    const fetchFn = async (entrada: string | URL | Request) => String(entrada).includes("phone_numbers")
      ? new Response(JSON.stringify({ data: [{ id: "phone-1" }] }), { status: 200 })
      : new Response(JSON.stringify({ success: true }), { status: 200 });
    await expect(new MetaOAuthProvider(segredo, fetchFn as typeof fetch).assinarWebhooksWhatsApp("waba-1", "phone-1", "token")).resolves.toBeUndefined();
    await expect(new MetaOAuthProvider(segredo, fetchFn as typeof fetch).assinarWebhooksWhatsApp("waba-1", "phone-2", "token")).rejects.toThrow("META_TELEFONE_FORA_DA_WABA");
  });

  it("troca o código do Instagram por token de longa duração", async () => {
    process.env.META_INSTAGRAM_APP_ID = "instagram-app";
    process.env.META_INSTAGRAM_APP_SECRET_REF = "cofre/instagram-secret";
    const chamadas: string[] = [];
    const fetchFn = async (entrada: string | URL | Request) => {
      const url = String(entrada); chamadas.push(url);
      return url.includes("api.instagram.com")
        ? new Response(JSON.stringify({ access_token: "curto", user_id: 987 }), { status: 200 })
        : new Response(JSON.stringify({ access_token: "longo" }), { status: 200 });
    };
    await expect(new MetaOAuthProvider(segredo, fetchFn as typeof fetch).trocarCodigo("codigo", "https://app.example/atendimento", "INSTAGRAM"))
      .resolves.toEqual({ token: "longo", appSecretRef: "cofre/instagram-secret", identificadorExterno: "987", expiraEm: null });
    expect(chamadas[0]).toBe("https://api.instagram.com/oauth/access_token");
    expect(chamadas[1]).toContain("https://graph.instagram.com/access_token?");
  });

  it("renova o token longo do Instagram e calcula sua validade", async () => {
    const fetchFn = async () => new Response(JSON.stringify({ access_token: "token-renovado", expires_in: 5_184_000 }), { status: 200 });
    const antes = Date.now() + 5_183_000_000;
    const resultado = await new MetaOAuthProvider(segredo, fetchFn as typeof fetch).renovarTokenInstagram("token-atual");
    expect(resultado.token).toBe("token-renovado");
    expect(resultado.expiraEm!.getTime()).toBeGreaterThan(antes);
  });
});
