export async function iniciarOAuthInstagram(): Promise<{ codigo: string }> {
  const clientId = import.meta.env.VITE_META_INSTAGRAM_APP_ID?.trim();
  const redirectUri = import.meta.env.VITE_META_INSTAGRAM_REDIRECT_URI?.trim();
  if (!clientId || !redirectUri) throw new Error("META_INSTAGRAM_OAUTH_NAO_CONFIGURADO");
  const state = crypto.randomUUID();
  sessionStorage.setItem("@sgcl:meta-instagram-state", state);
  const parametros = new URLSearchParams({
    enable_fb_login: "0", force_authentication: "1", client_id: clientId, redirect_uri: redirectUri,
    response_type: "code", scope: "instagram_business_basic,instagram_business_manage_messages", state,
  });
  const popup = window.open(`https://www.instagram.com/oauth/authorize?${parametros}`, "sysbelt-instagram-oauth", "popup,width=620,height=760");
  if (!popup) throw new Error("META_POPUP_BLOQUEADO");
  const janela = popup;
  return new Promise((resolve, reject) => {
    const limite = window.setTimeout(() => finalizar(new Error("META_SIGNUP_EXPIRADO")), 5 * 60_000);
    const intervalo = window.setInterval(() => {
      if (janela.closed) return finalizar(new Error("META_SIGNUP_CANCELADO"));
      try {
        const url = new URL(janela.location.href);
        if (url.origin !== new URL(redirectUri).origin || url.pathname !== new URL(redirectUri).pathname) return;
        const codigo = url.searchParams.get("code")?.replace(/#_$/, "");
        const recebido = url.searchParams.get("state");
        if (!codigo || recebido !== sessionStorage.getItem("@sgcl:meta-instagram-state")) return finalizar(new Error("META_OAUTH_STATE_INVALIDO"));
        finalizar(undefined, codigo);
      } catch { /* O popup permanece cross-origin enquanto a Meta está aberta. */ }
    }, 300);
    function finalizar(erro?: Error, codigo?: string) {
      window.clearTimeout(limite); window.clearInterval(intervalo); sessionStorage.removeItem("@sgcl:meta-instagram-state");
      if (!janela.closed) janela.close();
      if (erro) reject(erro); else resolve({ codigo: codigo! });
    }
  });
}
