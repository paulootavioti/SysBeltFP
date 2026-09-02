import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { getFotosStore } from "../../uploads/services/blobStore";
import { SecretValueProviderAws, type SecretValueProvider } from "../../../shared/tenant/SecretValueProvider";
import { MetaMediaProvider } from "./MetaMediaProvider";

const MAXIMO_BYTES = 16 * 1024 * 1024;
const EXTENSOES: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
  "audio/aac": "aac", "audio/amr": "amr", "audio/mpeg": "mp3", "audio/ogg": "ogg", "audio/mp4": "m4a",
  "video/mp4": "mp4", "video/3gpp": "3gp", "application/pdf": "pdf", "text/plain": "txt",
  "application/msword": "doc", "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

export class ProcessarMidiasMensageriaService {
  constructor(
    private readonly db: PrismaClient,
    private readonly meta = new MetaMediaProvider(),
    private readonly segredos: SecretValueProvider = new SecretValueProviderAws(),
    private readonly store: { set(chave: string, valor: Blob, opcoes?: { metadata?: Record<string, string> }): Promise<unknown> } = getFotosStore(),
  ) {}

  async executar(limite = 20) {
    const mensagens = await this.db.mensagemMensageria.findMany({
      where: { mediaStatus: { in: ["PENDENTE", "FALHOU"] }, tentativasMedia: { lt: 4 }, OR: [{ proximaTentativaMediaEm: null }, { proximaTentativaMediaEm: { lte: new Date() } }] },
      orderBy: { criadoEm: "asc" }, take: Math.min(Math.max(limite, 1), 50),
      include: { canalMensageria: { select: { tipo: true, tokenRef: true } } },
    });
    let processadas = 0; let falhas = 0;
    for (const mensagem of mensagens) {
      const reserva = await this.db.mensagemMensageria.updateMany({ where: { id: mensagem.id, mediaStatus: mensagem.mediaStatus, proximaTentativaMediaEm: mensagem.proximaTentativaMediaEm }, data: { mediaStatus: "PROCESSANDO", tentativasMedia: { increment: 1 } } });
      if (!reserva.count) continue;
      try { await this.processar(mensagem); processadas++; }
      catch (erro) {
        falhas++;
        const tentativas = mensagem.tentativasMedia + 1;
        const codigo = erro instanceof Error && /^META_MEDIA_[A-Z0-9_]+$/.test(erro.message) ? erro.message : erro instanceof Error && erro.message === "MEDIA_NAO_SUPORTADA" ? erro.message : "MEDIA_PROCESSAMENTO_FALHOU";
        await this.db.mensagemMensageria.update({ where: { id: mensagem.id }, data: { mediaStatus: "FALHOU", erroMedia: codigo, proximaTentativaMediaEm: tentativas < 4 ? new Date(Date.now() + 5 * 60_000) : null } });
      }
    }
    return { encontradas: mensagens.length, processadas, falhas };
  }

  private async processar(mensagem: Awaited<ReturnType<PrismaClient["mensagemMensageria"]["findFirstOrThrow"]>> & { canalMensageria: { tipo: "WHATSAPP" | "INSTAGRAM"; tokenRef: string } }) {
    const token = await this.segredos.obter(mensagem.canalMensageria.tokenRef);
    const origem = mensagem.canalMensageria.tipo === "WHATSAPP"
      ? await this.meta.obterWhatsApp(mensagem.mediaExternaId || "", token)
      : { url: mensagem.mediaUrlOrigem || "", mime: undefined, tamanho: undefined };
    if (origem.tamanho && origem.tamanho > MAXIMO_BYTES) throw new Error("MEDIA_NAO_SUPORTADA");
    const arquivo = await this.meta.baixar(origem.url, mensagem.canalMensageria.tipo === "WHATSAPP" ? token : undefined);
    const mime = arquivo.mime || origem.mime || "";
    if (!EXTENSOES[mime] || arquivo.buffer.length > MAXIMO_BYTES || (arquivo.tamanho && arquivo.tamanho > MAXIMO_BYTES)) throw new Error("MEDIA_NAO_SUPORTADA");
    const chave = `mensageria/${randomUUID()}.${EXTENSOES[mime]}`;
    await this.store.set(chave, new Blob([Uint8Array.from(arquivo.buffer)], { type: mime }), { metadata: { contentType: mime } });
    await this.db.mensagemMensageria.update({ where: { id: mensagem.id }, data: { mediaStatus: "DISPONIVEL", arquivoUrl: `/uploads/${chave}`, arquivoMime: mime, arquivoTamanho: arquivo.buffer.length, erroMedia: null, proximaTentativaMediaEm: null, mediaUrlOrigem: null } });
  }
}
