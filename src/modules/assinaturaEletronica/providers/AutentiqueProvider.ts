import { AppError } from "../../../shared/errors/AppError";
import type {
  DocumentoAssinadoResultado,
  ElectronicSignatureProvider,
  EnviarParaAssinaturaDTO,
  EnviarParaAssinaturaResultado,
  WebhookEventoAssinatura,
} from "./ElectronicSignatureProvider";

const ENDPOINT = "https://api.autentique.com.br/v2/graphql";
const TIMEOUT_MS = 20_000;

export class AutentiqueProvider implements ElectronicSignatureProvider {
  readonly nome = "Autentique";

  constructor(private readonly token = process.env.AUTENTIQUE_API_TOKEN ?? "") {}

  async enviarParaAssinatura(dados: EnviarParaAssinaturaDTO): Promise<EnviarParaAssinaturaResultado> {
    if (!this.token) throw new AppError("Autentique não configurado: informe AUTENTIQUE_API_TOKEN.", 503);
    if (!dados.signatarios.some((signatario) => signatario.email)) {
      throw new AppError("É necessário cadastrar o e-mail do contratante para enviar o contrato.");
    }

    const query = `mutation CreateDocumentMutation($document: DocumentInput!, $signers: [SignerInput!]!, $file: Upload!) {
      createDocument(document: $document, signers: $signers, file: $file) {
        id name signatures { public_id name email link { short_link } }
      }
    }`;
    const operations = {
      query,
      variables: {
        document: {
          name: `Contrato ${dados.referenciaExterna}`,
          message: "Acesse o link para revisar e assinar seu contrato.",
          refusable: true,
          scrolling_required: true,
        },
        signers: dados.signatarios.filter((item) => item.email).map((item) => ({
          name: item.nome,
          email: item.email,
          cpf: item.cpf || undefined,
          action: "SIGN",
        })),
        file: null,
      },
    };
    const formulario = new FormData();
    formulario.set("operations", JSON.stringify(operations));
    formulario.set("map", JSON.stringify({ file: ["variables.file"] }));
    formulario.set("file", new Blob([documentoHtml(dados.conteudo)], { type: "text/html;charset=utf-8" }), `contrato-${dados.referenciaExterna}.html`);

    const resposta = await this.chamar<{ createDocument: DocumentoAutentique }>(formulario);
    const documento = resposta.createDocument;
    return {
      provedorDocumentoId: documento.id,
      linkAssinatura: documento.signatures.find((item) => item.link?.short_link)?.link?.short_link ?? undefined,
      status: "PENDENTE",
    };
  }

  async consultarStatus(provedorDocumentoId: string): Promise<string> {
    const dados = await this.graphql<{ document: { signed: boolean; rejected: boolean } | null }>(
      `query Document($id: UUID!) { document(id: $id) { signed rejected } }`, { id: provedorDocumentoId }
    );
    if (!dados.document) return "NAO_ENCONTRADO";
    if (dados.document.rejected) return "RECUSADO";
    return dados.document.signed ? "CONCLUIDO" : "PENDENTE";
  }

  async cancelarSolicitacao(provedorDocumentoId: string): Promise<void> {
    await this.graphql(`mutation DeleteDocument($id: UUID!) { deleteDocument(id: $id) }`, { id: provedorDocumentoId });
  }

  async baixarDocumentoAssinado(provedorDocumentoId: string): Promise<DocumentoAssinadoResultado> {
    const dados = await this.graphql<{ document: { files?: { signed?: string | null } } | null }>(
      `query Document($id: UUID!) { document(id: $id) { files { signed } } }`, { id: provedorDocumentoId }
    );
    const url = dados.document?.files?.signed;
    if (!url) throw new AppError("O documento assinado ainda não está disponível.", 409);
    return { url };
  }

  async processarWebhook(payload: unknown): Promise<WebhookEventoAssinatura> {
    const corpo = payload as AutentiqueWebhook;
    return {
      tipo: corpo?.event?.type ?? "desconhecido",
      referenciaExterna: corpo?.event?.data?.object?.id,
      payload,
    };
  }

  private async graphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    return this.chamar<T>(JSON.stringify({ query, variables }), "application/json");
  }

  private async chamar<T>(corpo: BodyInit, contentType?: string): Promise<T> {
    if (!this.token) throw new AppError("Autentique não configurado: informe AUTENTIQUE_API_TOKEN.", 503);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const resposta = await fetch(ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.token}`, ...(contentType ? { "Content-Type": contentType } : {}) },
        body: corpo,
        signal: controller.signal,
      });
      const json = (await resposta.json()) as { data?: T; errors?: { message: string }[] };
      if (!resposta.ok || json.errors?.length || !json.data) {
        throw new AppError(`Autentique recusou a operação: ${json.errors?.[0]?.message ?? resposta.status}.`, 502);
      }
      return json.data;
    } catch (erro) {
      if (erro instanceof AppError) throw erro;
      if (erro instanceof Error && erro.name === "AbortError") throw new AppError("Autentique não respondeu a tempo. Tente novamente.", 504);
      throw new AppError("Falha ao falar com o Autentique.", 502);
    } finally {
      clearTimeout(timer);
    }
  }
}

interface DocumentoAutentique {
  id: string;
  signatures: { link?: { short_link?: string | null } | null }[];
}

interface AutentiqueWebhook {
  event?: { type?: string; data?: { object?: { id?: string } } };
}

function documentoHtml(conteudo: string): string {
  const texto = conteudo.split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;").split("\n").join("<br>");
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Contrato</title><style>body{font-family:Arial,sans-serif;font-size:12pt;line-height:1.55;margin:48px;color:#111}</style></head><body>${texto}</body></html>`;
}
