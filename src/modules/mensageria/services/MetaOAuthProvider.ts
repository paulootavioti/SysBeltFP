import type { SecretValueProvider } from "../../../shared/tenant/SecretValueProvider";

interface RespostaToken { access_token?: string; user_id?: number | string; expires_in?: number; }
interface DebugToken { data?: { app_id?: string; is_valid?: boolean; expires_at?: number; scopes?: string[] } }

export class MetaOAuthProvider {
  constructor(
    private readonly segredos: SecretValueProvider,
    private readonly fetchFn: typeof fetch = fetch,
    private readonly versao = process.env.META_GRAPH_API_VERSION?.trim() || "v23.0",
  ) {}

  private configuracao(tipo: "WHATSAPP" | "INSTAGRAM") {
    const appId = (tipo === "INSTAGRAM" ? process.env.META_INSTAGRAM_APP_ID : undefined)?.trim() || process.env.META_APP_ID?.trim();
    const appSecretRef = (tipo === "INSTAGRAM" ? process.env.META_INSTAGRAM_APP_SECRET_REF : undefined)?.trim() || process.env.META_APP_SECRET_REF?.trim();
    if (!appId || !appSecretRef) throw new Error("META_ONBOARDING_NAO_CONFIGURADO");
    return { appId, appSecretRef };
  }

  async trocarCodigo(codigo: string, redirectUri: string, tipo: "WHATSAPP" | "INSTAGRAM" = "WHATSAPP") {
    const { appId, appSecretRef } = this.configuracao(tipo);
    const appSecret = await this.segredos.obter(appSecretRef);
    if (tipo === "INSTAGRAM") return this.trocarCodigoInstagram(codigo, redirectUri, appId, appSecret, appSecretRef);
    const parametros = new URLSearchParams({ client_id: appId, client_secret: appSecret, code: codigo, redirect_uri: redirectUri });
    const resposta = await this.fetchFn(`https://graph.facebook.com/${this.versao}/oauth/access_token?${parametros}`, { signal: AbortSignal.timeout(8_000) });
    const payload = await resposta.json() as RespostaToken;
    if (!resposta.ok || !payload.access_token) throw new Error("META_CODIGO_INVALIDO");
    const token = await this.validarToken(payload.access_token, appId, appSecret);
    return { token: payload.access_token, appSecretRef, expiraEm: token.expiraEm };
  }

  private async trocarCodigoInstagram(codigo: string, redirectUri: string, appId: string, appSecret: string, appSecretRef: string) {
    const corpo = new URLSearchParams({ client_id: appId, client_secret: appSecret, grant_type: "authorization_code", redirect_uri: redirectUri, code: codigo });
    const curta = await this.fetchFn("https://api.instagram.com/oauth/access_token", {
      method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: corpo, signal: AbortSignal.timeout(8_000),
    });
    const respostaCurta = await curta.json() as RespostaToken;
    if (!curta.ok || !respostaCurta.access_token || !respostaCurta.user_id) throw new Error("META_CODIGO_INVALIDO");
    const parametros = new URLSearchParams({ grant_type: "ig_exchange_token", client_secret: appSecret, access_token: respostaCurta.access_token });
    const longa = await this.fetchFn(`https://graph.instagram.com/access_token?${parametros}`, { signal: AbortSignal.timeout(8_000) });
    const respostaLonga = await longa.json() as RespostaToken;
    if (!longa.ok || !respostaLonga.access_token) throw new Error("META_TOKEN_INVALIDO");
    return { token: respostaLonga.access_token, appSecretRef, identificadorExterno: String(respostaCurta.user_id), expiraEm: this.dataExpiracao(respostaLonga.expires_in) };
  }

  private async validarToken(token: string, appId: string, appSecret: string) {
    const parametros = new URLSearchParams({ input_token: token, access_token: `${appId}|${appSecret}` });
    const resposta = await this.fetchFn(`https://graph.facebook.com/${this.versao}/debug_token?${parametros}`, { signal: AbortSignal.timeout(8_000) });
    const payload = await resposta.json() as DebugToken;
    if (!resposta.ok || !payload.data?.is_valid || payload.data.app_id !== appId) throw new Error("META_TOKEN_INVALIDO");
    return { expiraEm: payload.data.expires_at ? new Date(payload.data.expires_at * 1_000) : null };
  }

  private dataExpiracao(segundos?: number) {
    return segundos && Number.isFinite(segundos) ? new Date(Date.now() + segundos * 1_000) : null;
  }

  async renovarTokenInstagram(token: string) {
    const parametros = new URLSearchParams({ grant_type: "ig_refresh_token", access_token: token });
    const resposta = await this.fetchFn(`https://graph.instagram.com/refresh_access_token?${parametros}`, { signal: AbortSignal.timeout(8_000) });
    const payload = await resposta.json() as RespostaToken;
    if (!resposta.ok || !payload.access_token) throw new Error("META_RENOVACAO_FALHOU");
    return { token: payload.access_token, expiraEm: this.dataExpiracao(payload.expires_in) };
  }

  async validarConta(tipo: "WHATSAPP" | "INSTAGRAM", identificador: string, token: string) {
    const fields = tipo === "WHATSAPP" ? "id,display_phone_number,verified_name" : "id,username,name";
    const host = tipo === "INSTAGRAM" ? "https://graph.instagram.com" : "https://graph.facebook.com";
    const url = `${host}/${this.versao}/${encodeURIComponent(identificador)}?fields=${encodeURIComponent(fields)}`;
    const resposta = await this.fetchFn(url, { headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8_000) });
    const payload = await resposta.json() as { id?: string; display_phone_number?: string; verified_name?: string; username?: string; name?: string };
    if (!resposta.ok || String(payload.id) !== identificador) throw new Error("META_CONTA_INACESSIVEL");
    const nome = tipo === "WHATSAPP" ? payload.verified_name || payload.display_phone_number : payload.name || payload.username;
    return { nomeExibicao: nome?.trim() || (tipo === "WHATSAPP" ? "WhatsApp" : "Instagram") };
  }

  async assinarWebhooksWhatsApp(businessAccountId: string, phoneNumberId: string, token: string) {
    if (!businessAccountId) throw new Error("META_WABA_INVALIDA");
    const base = `https://graph.facebook.com/${this.versao}/${encodeURIComponent(businessAccountId)}`;
    const telefones = await this.fetchFn(`${base}/phone_numbers?fields=id`, { headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8_000) });
    const lista = await telefones.json() as { data?: Array<{ id?: string }> };
    if (!telefones.ok || !lista.data?.some(({ id }) => id === phoneNumberId)) throw new Error("META_TELEFONE_FORA_DA_WABA");
    const url = `${base}/subscribed_apps`;
    const resposta = await this.fetchFn(url, { method: "POST", headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8_000) });
    const payload = await resposta.json() as { success?: boolean };
    if (!resposta.ok || payload.success !== true) throw new Error("META_WEBHOOK_NAO_ASSINADO");
  }

  async assinarWebhooksInstagram(identificador: string, token: string) {
    const campos = "messages,messaging_postbacks,message_reactions";
    const url = `https://graph.instagram.com/${this.versao}/${encodeURIComponent(identificador)}/subscribed_apps?subscribed_fields=${encodeURIComponent(campos)}`;
    const resposta = await this.fetchFn(url, { method: "POST", headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8_000) });
    const payload = await resposta.json() as { success?: boolean };
    if (!resposta.ok || payload.success !== true) throw new Error("META_WEBHOOK_NAO_ASSINADO");
  }
}
