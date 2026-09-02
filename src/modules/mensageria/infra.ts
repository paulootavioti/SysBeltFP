import { MensageriaDirectoryHttp } from "../../shared/tenant/MensageriaDirectory";
import { SecretValueProviderAws, SecretWriteProviderAws } from "../../shared/tenant/SecretValueProvider";
import { MetaOAuthProvider } from "./services/MetaOAuthProvider";
import { ControlPlaneMensageriaClient } from "./services/ControlPlaneMensageriaClient";

let infraestrutura: ReturnType<typeof criar> | undefined;

function criar() {
  const url = process.env.CONTROL_PLANE_URL?.trim();
  const segredo = process.env.TENANT_DIRECTORY_SECRET?.trim();
  if (!url || !segredo) throw new Error("MENSAGERIA_NAO_CONFIGURADA");
  const segredos = new SecretValueProviderAws();
  return {
    diretorio: new MensageriaDirectoryHttp(url, segredo),
    segredos,
    escritaSegredos: new SecretWriteProviderAws(),
    oauthMeta: new MetaOAuthProvider(segredos),
    diretorioMensageria: new ControlPlaneMensageriaClient(url, segredo),
  };
}

export function infraestruturaMensageria() { return infraestrutura ??= criar(); }
