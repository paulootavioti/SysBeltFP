import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { AppError } from "../../../shared/errors/AppError";
import { getFotosStore } from "../../uploads/services/blobStore";

const MAXIMO_BYTES = 16 * 1024 * 1024;
const EXTENSOES: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
  "audio/aac": "aac", "audio/amr": "amr", "audio/mpeg": "mp3", "audio/ogg": "ogg", "audio/mp4": "m4a",
  "video/mp4": "mp4", "video/3gpp": "3gp", "application/pdf": "pdf", "text/plain": "txt",
  "application/msword": "doc", "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

function tipoConteudo(mime: string) {
  if (mime.startsWith("image/")) return "IMAGEM" as const;
  if (mime.startsWith("audio/")) return "AUDIO" as const;
  if (mime.startsWith("video/")) return "VIDEO" as const;
  return "DOCUMENTO" as const;
}

export class ArmazenarAnexoMensageriaService {
  constructor(private readonly db: PrismaClient, private readonly store: { set(chave: string, valor: Blob, opcoes?: { metadata?: Record<string, string> }): Promise<unknown> } = getFotosStore()) {}

  async executar(dados: { conversaId: number; unidadeId: number; usuarioId: number; buffer: Buffer; mime: string; nome: string; legenda?: string }) {
    const conversa = await this.db.conversaMensageria.findFirst({ where: { id: dados.conversaId, unidadeId: dados.unidadeId }, include: { canalMensageria: { select: { tipo: true } }, mensagens: { where: { direcao: "ENTRADA" }, orderBy: { enviadaEm: "desc" }, take: 1, select: { enviadaEm: true } } } });
    if (!conversa) throw new AppError("Conversa não encontrada.", 404);
    if (conversa.estado === "ENCERRADA") throw new AppError("Reabra a conversa antes de enviar anexos.");
    if (conversa.canalMensageria.tipo === "WHATSAPP" && (!conversa.mensagens[0] || conversa.mensagens[0].enviadaEm.getTime() + 24 * 60 * 60_000 <= Date.now())) throw new AppError("A janela de 24 horas encerrou. Use um template aprovado.");
    if (!EXTENSOES[dados.mime] || !dados.buffer.length || dados.buffer.length > MAXIMO_BYTES) throw new AppError("Formato ou tamanho de anexo não suportado.");
    if (conversa.canalMensageria.tipo === "INSTAGRAM" && !/^(image|audio|video)\//.test(dados.mime)) throw new AppError("Este formato não pode ser enviado pelo Instagram.");
    const nome = dados.nome.replace(/[\\/\0]/g, "_").slice(0, 200) || `anexo.${EXTENSOES[dados.mime]}`;
    const legenda = conversa.canalMensageria.tipo === "WHATSAPP" ? dados.legenda?.trim().slice(0, 1_024) || undefined : undefined;
    const chave = `mensageria/${randomUUID()}.${EXTENSOES[dados.mime]}`;
    await this.store.set(chave, new Blob([Uint8Array.from(dados.buffer)], { type: dados.mime }), { metadata: { contentType: dados.mime } });
    return this.db.$transaction(async (tx) => {
      const mensagem = await tx.mensagemMensageria.create({ data: {
        conversaId: conversa.id, canalMensageriaId: conversa.canalMensageriaId, mensagemExternaId: `atendente-anexo:${randomUUID()}`,
        direcao: "SAIDA", autor: "ATENDENTE", usuarioId: dados.usuarioId, conteudo: legenda, tipoConteudo: tipoConteudo(dados.mime),
        statusEntrega: "PENDENTE", mediaStatus: "DISPONIVEL", arquivoUrl: `/uploads/${chave}`, arquivoMime: dados.mime, arquivoNome: nome, arquivoTamanho: dados.buffer.length, enviadaEm: new Date(),
      } });
      await tx.conversaMensageria.update({ where: { id: conversa.id }, data: { atendenteId: conversa.atendenteId ?? dados.usuarioId, estado: "EM_ATENDIMENTO", ultimaMensagemEm: mensagem.enviadaEm } });
      if (conversa.leadId) await tx.leadEvento.create({ data: { leadId: conversa.leadId, unidadeId: conversa.unidadeId, usuarioId: dados.usuarioId, tipo: "ANEXO_ATENDENTE", descricao: "Anexo enviado pelo atendimento.", payload: { conversaId: conversa.id, tipo: mensagem.tipoConteudo } } });
      return mensagem;
    });
  }
}
