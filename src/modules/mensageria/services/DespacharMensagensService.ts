import type { PrismaClient } from "@prisma/client";
import { SecretValueProviderAws, type SecretValueProvider } from "../../../shared/tenant/SecretValueProvider";
import { ErroEnvioMeta, MetaEnvioProvider } from "../MetaEnvioProvider";
import { assinarUrlFoto } from "../../uploads/services/assinarUrlFoto";

function urlPublicaAnexo(caminho: string) {
  const base = process.env.PUBLIC_API_URL?.trim().replace(/\/$/, "");
  if (!base) throw new Error("META_MEDIA_URL_PUBLICA_NAO_CONFIGURADA");
  const origem = new URL(base);
  if (!/^https?:$/.test(origem.protocol)) throw new Error("META_MEDIA_URL_PUBLICA_NAO_CONFIGURADA");
  return `${base}${assinarUrlFoto(caminho)}`;
}

export class DespacharMensagensService {
  constructor(
    private readonly db: PrismaClient,
    private readonly provedor = new MetaEnvioProvider(),
    private readonly segredos: SecretValueProvider = new SecretValueProviderAws(),
  ) {}

  async executar(limite = 50) {
    const mensagens = await this.db.mensagemMensageria.findMany({
      where: { direcao: "SAIDA", OR: [
        { statusEntrega: "PENDENTE", OR: [{ proximaTentativaEm: null }, { proximaTentativaEm: { lte: new Date() } }] },
        { statusEntrega: "FALHOU", proximaTentativaEm: { lte: new Date() }, tentativasEnvio: { lt: 4 } },
      ] },
      orderBy: { criadoEm: "asc" }, take: Math.min(Math.max(limite, 1), 100),
      include: { conversa: { select: { contatoExternoId: true } }, canalMensageria: { select: { tipo: true, identificadorExterno: true, tokenRef: true, ativo: true } } },
    });
    let enviadas = 0;
    for (const mensagem of mensagens) if (await this.enviarCarregada(mensagem)) enviadas++;
    return { encontradas: mensagens.length, enviadas };
  }

  async enviarMensagem(id: number) {
    const mensagem = await this.db.mensagemMensageria.findUnique({
      where: { id },
      include: { conversa: { select: { contatoExternoId: true } }, canalMensageria: { select: { tipo: true, identificadorExterno: true, tokenRef: true, ativo: true } } },
    });
    if (!mensagem || mensagem.direcao !== "SAIDA" || !["PENDENTE", "FALHOU"].includes(mensagem.statusEntrega)) return false;
    return this.enviarCarregada(mensagem);
  }

  private async enviarCarregada(mensagem: Awaited<ReturnType<PrismaClient["mensagemMensageria"]["findFirstOrThrow"]>> & {
    conversa: { contatoExternoId: string }; canalMensageria: { tipo: "WHATSAPP" | "INSTAGRAM"; identificadorExterno: string; tokenRef: string; ativo: boolean };
  }) {
    if (!mensagem.canalMensageria.ativo || (!mensagem.conteudo && !mensagem.payload && !mensagem.arquivoUrl)) return false;
    const reservaAte = new Date(Date.now() + 2 * 60_000);
    const reserva = await this.db.mensagemMensageria.updateMany({
      where: { id: mensagem.id, statusEntrega: mensagem.statusEntrega, proximaTentativaEm: mensagem.proximaTentativaEm },
      data: { proximaTentativaEm: reservaAte },
    });
    if (reserva.count !== 1) return false;
    try {
      const token = await this.segredos.obter(mensagem.canalMensageria.tokenRef);
      const payload = mensagem.payload as { template?: { nome?: string; idioma?: string; parametros?: string[] } } | null;
      const template = payload?.template?.nome ? { nome: payload.template.nome, idioma: payload.template.idioma || "pt_BR", parametros: payload.template.parametros } : undefined;
      const media = mensagem.arquivoUrl && ["IMAGEM", "AUDIO", "VIDEO", "DOCUMENTO"].includes(mensagem.tipoConteudo) ? {
        tipo: mensagem.tipoConteudo as "IMAGEM" | "AUDIO" | "VIDEO" | "DOCUMENTO", url: urlPublicaAnexo(mensagem.arquivoUrl), nome: mensagem.arquivoNome || undefined, legenda: mensagem.conteudo || undefined,
      } : undefined;
      const provedorMensagemId = await this.provedor.enviar({
        tipo: mensagem.canalMensageria.tipo, identificadorConta: mensagem.canalMensageria.identificadorExterno,
        contatoExternoId: mensagem.conversa.contatoExternoId, texto: template || media ? undefined : mensagem.conteudo || undefined, template, media, token,
      });
      await this.db.mensagemMensageria.update({ where: { id: mensagem.id }, data: { statusEntrega: "ENVIADA", provedorMensagemId, erroEnvio: null, proximaTentativaEm: null, tentativasEnvio: { increment: 1 } } });
      return true;
    } catch (erro) {
      const codigo = erro instanceof Error && /^META_[A-Z0-9_]+$/.test(erro.message) ? erro.message : "ENVIO_INDISPONIVEL";
      const tentativas = mensagem.tentativasEnvio + 1;
      const transitório = erro instanceof ErroEnvioMeta ? erro.transitorio : true;
      const proximaTentativaEm = transitório && tentativas < 4 ? new Date(Date.now() + Math.min(2 ** tentativas * 60_000, 30 * 60_000)) : null;
      await this.db.mensagemMensageria.update({ where: { id: mensagem.id }, data: { statusEntrega: "FALHOU", erroEnvio: codigo, tentativasEnvio: tentativas, proximaTentativaEm } });
      return false;
    }
  }
}
