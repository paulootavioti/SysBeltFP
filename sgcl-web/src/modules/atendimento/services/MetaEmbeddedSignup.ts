interface FacebookRespostaLogin { authResponse?: { code?: string }; status?: string; }
interface FacebookSdk {
  init(config: { appId: string; cookie: boolean; xfbml: boolean; version: string }): void;
  login(callback: (resposta: FacebookRespostaLogin) => void, config: Record<string, unknown>): void;
}

declare global { interface Window { FB?: FacebookSdk; fbAsyncInit?: () => void; } }

export interface ResultadoEmbeddedSignup { codigo: string; identificadorExterno: string; businessAccountId: string; }

async function carregarSdk(appId: string) {
  if (window.FB) return window.FB;
  await new Promise<void>((resolve, reject) => {
    window.fbAsyncInit = () => { window.FB!.init({ appId, cookie: true, xfbml: false, version: import.meta.env.VITE_META_GRAPH_API_VERSION || "v23.0" }); resolve(); };
    const script = document.createElement("script"); script.id = "facebook-jssdk"; script.src = "https://connect.facebook.net/pt_BR/sdk.js"; script.async = true; script.defer = true; script.onerror = () => reject(new Error("META_SDK_INDISPONIVEL")); document.head.appendChild(script);
  });
  return window.FB!;
}

export async function iniciarEmbeddedSignupWhatsApp(): Promise<ResultadoEmbeddedSignup> {
  const appId = import.meta.env.VITE_META_APP_ID?.trim();
  const configId = import.meta.env.VITE_META_WHATSAPP_CONFIG_ID?.trim();
  if (!appId || !configId) throw new Error("META_EMBEDDED_SIGNUP_NAO_CONFIGURADO");
  const sdk = await carregarSdk(appId);
  return new Promise((resolve, reject) => {
    let dadosSessao: { phone_number_id?: string; waba_id?: string } | undefined;
    let codigo = "";
    let finalizado = false;
    const concluir = () => {
      if (finalizado || !codigo || !dadosSessao?.phone_number_id || !dadosSessao.waba_id) return;
      finalizado = true; window.removeEventListener("message", receberSessao); window.clearTimeout(timeout);
      resolve({ codigo, identificadorExterno: dadosSessao.phone_number_id, businessAccountId: dadosSessao.waba_id });
    };
    const receberSessao = (evento: MessageEvent) => {
      let hostname = "";
      try { hostname = new URL(evento.origin).hostname; } catch { return; }
      if (hostname !== "facebook.com" && !hostname.endsWith(".facebook.com")) return;
      let payload = evento.data;
      if (typeof payload === "string") { try { payload = JSON.parse(payload); } catch { return; } }
      if (payload?.type !== "WA_EMBEDDED_SIGNUP") return;
      if (payload.event === "CANCEL") { finalizado = true; window.clearTimeout(timeout); reject(new Error("META_SIGNUP_CANCELADO")); return; }
      if (payload.event === "FINISH") { dadosSessao = payload.data; concluir(); }
    };
    window.addEventListener("message", receberSessao);
    const timeout = window.setTimeout(() => { if (!finalizado) { finalizado = true; window.removeEventListener("message", receberSessao); reject(new Error("META_SIGNUP_EXPIRADO")); } }, 5 * 60_000);
    sdk.login((resposta) => {
      codigo = resposta.authResponse?.code || "";
      if (!codigo && !finalizado) { finalizado = true; window.removeEventListener("message", receberSessao); window.clearTimeout(timeout); reject(new Error("META_AUTORIZACAO_NEGADA")); return; }
      concluir();
    }, { config_id: configId, response_type: "code", override_default_response_type: true, extras: { setup: {}, featureType: "", sessionInfoVersion: "3" } });
  });
}
