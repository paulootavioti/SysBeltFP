import type {
  DocumentoAssinadoResultado,
  ElectronicSignatureProvider,
  EnviarParaAssinaturaDTO,
  EnviarParaAssinaturaResultado,
  WebhookEventoAssinatura,
} from "./ElectronicSignatureProvider";
import { ProvedorAssinaturaNaoImplementadoError } from "./ElectronicSignatureProvider";

// Base comum pros provedores ainda não integrados — cada plataforma
// (Clicksign, D4Sign, Autentique, DocuSign, Adobe Sign) tem sua própria
// classe (ver os arquivos irmãos), só pra já existir o ponto de extensão
// nomeado onde a integração real vai entrar. Até lá, qualquer chamada
// lança `ProvedorAssinaturaNaoImplementadoError` — nunca falha silenciosamente.
export abstract class StubElectronicSignatureProvider implements ElectronicSignatureProvider {
  abstract readonly nome: string;

  async enviarParaAssinatura(_dados: EnviarParaAssinaturaDTO): Promise<EnviarParaAssinaturaResultado> {
    throw new ProvedorAssinaturaNaoImplementadoError(this.nome);
  }

  async consultarStatus(_provedorDocumentoId: string): Promise<string> {
    throw new ProvedorAssinaturaNaoImplementadoError(this.nome);
  }

  async cancelarSolicitacao(_provedorDocumentoId: string): Promise<void> {
    throw new ProvedorAssinaturaNaoImplementadoError(this.nome);
  }

  async baixarDocumentoAssinado(_provedorDocumentoId: string): Promise<DocumentoAssinadoResultado> {
    throw new ProvedorAssinaturaNaoImplementadoError(this.nome);
  }

  async processarWebhook(_payload: unknown): Promise<WebhookEventoAssinatura> {
    throw new ProvedorAssinaturaNaoImplementadoError(this.nome);
  }
}
