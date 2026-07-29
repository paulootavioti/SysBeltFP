import type { ElectronicSignatureProvider } from "./ElectronicSignatureProvider";
import { NullElectronicSignatureProvider } from "./NullElectronicSignatureProvider";
import { ClicksignProvider } from "./ClicksignProvider";
import { D4SignProvider } from "./D4SignProvider";
import { AutentiqueProvider } from "./AutentiqueProvider";
import { DocuSignProvider } from "./DocuSignProvider";
import { AdobeSignProvider } from "./AdobeSignProvider";

export type { ElectronicSignatureProvider } from "./ElectronicSignatureProvider";
export { ProvedorAssinaturaNaoImplementadoError } from "./ElectronicSignatureProvider";

// Nome do provedor configurado pra assinatura eletrônica de contrato —
// quando ausente (o caso hoje, sempre), cai no NullElectronicSignatureProvider (manual).
export type NomeProvedorAssinatura =
  | "CLICKSIGN"
  | "D4SIGN"
  | "AUTENTIQUE"
  | "DOCUSIGN"
  | "ADOBE_SIGN";

const PROVEDORES: Record<NomeProvedorAssinatura, () => ElectronicSignatureProvider> = {
  CLICKSIGN: () => new ClicksignProvider(),
  D4SIGN: () => new D4SignProvider(),
  AUTENTIQUE: () => new AutentiqueProvider(),
  DOCUSIGN: () => new DocuSignProvider(),
  ADOBE_SIGN: () => new AdobeSignProvider(),
};

// Ponto único de escolha do provedor — services de negócio chamam só esta
// função, nunca instanciam um provedor concreto diretamente. Assinatura
// manual (digital/eletrônica/presencial registrada pelo Administrador,
// ver RegistrarAssinaturaService) e qualquer contrato sem provedor
// configurado usam o provedor manual.
export function obterProvedorAssinatura(nomeProvedor?: string | null): ElectronicSignatureProvider {
  if (!nomeProvedor) {
    return new NullElectronicSignatureProvider();
  }

  const fabrica = PROVEDORES[nomeProvedor as NomeProvedorAssinatura];

  return fabrica ? fabrica() : new NullElectronicSignatureProvider();
}
