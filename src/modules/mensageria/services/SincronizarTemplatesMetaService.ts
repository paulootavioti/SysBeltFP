import { Prisma, PrismaClient } from "@prisma/client";
import { AppError } from "../../../shared/errors/AppError";
import type { SecretValueProvider } from "../../../shared/tenant/SecretValueProvider";
import { MetaTemplateProvider, type ComponenteTemplateMeta } from "./MetaTemplateProvider";

export function analisarTemplate(componentes: ComponenteTemplateMeta[]) {
  const corpo = componentes.find((item) => item.type === "BODY")?.text?.trim() || "";
  const indices = [...corpo.matchAll(/\{\{(\d+)\}\}/g)].map((item) => Number(item[1]));
  const quantidadeParametros = indices.length ? Math.max(...indices) : 0;
  const cabecalho = componentes.find((item) => item.type === "HEADER");
  const headerDinamico = !!cabecalho && (cabecalho.format !== "TEXT" || /\{\{\d+\}\}/.test(cabecalho.text || ""));
  const botaoDinamico = componentes.some((item) => item.buttons?.some((botao) => /\{\{\d+\}\}/.test(botao.url || "")));
  return { textoExibicao: corpo || "Template sem corpo textual", quantidadeParametros, suportado: !headerDinamico && !botaoDinamico };
}

export class SincronizarTemplatesMetaService {
  constructor(private readonly db: PrismaClient, private readonly segredos: SecretValueProvider, private readonly meta = new MetaTemplateProvider()) {}

  async executar(unidadeId: number, canalId: number) {
    const canal = await this.db.canalMensageria.findFirst({ where: { id: canalId, unidadeId, tipo: "WHATSAPP", ativo: true } });
    if (!canal) throw new AppError("Canal WhatsApp não encontrado.", 404);
    if (!canal.businessAccountId) throw new AppError("Reconecte o WhatsApp para habilitar a sincronização de templates.", 409);
    const token = await this.segredos.obter(canal.tokenRef);
    let remotos;
    try { remotos = await this.meta.listar(canal.businessAccountId, token); }
    catch { throw new AppError("Não foi possível consultar os templates na Meta.", 503); }
    const agora = new Date();
    const ids = remotos.map((item) => item.id);
    await this.db.$transaction(async (tx) => {
      await tx.templateMensageria.updateMany({ where: { canalMensageriaId: canal.id, identificadorMeta: { not: null }, ...(ids.length ? { NOT: { identificadorMeta: { in: ids } } } : {}) }, data: { ativo: false, sincronizadoEm: agora } });
      for (const remoto of remotos) {
        const analise = analisarTemplate(remoto.components || []);
        await tx.templateMensageria.upsert({
          where: { canalMensageriaId_nome_idioma: { canalMensageriaId: canal.id, nome: remoto.name, idioma: remoto.language } },
          create: { unidadeId, canalMensageriaId: canal.id, identificadorMeta: remoto.id, nome: remoto.name, idioma: remoto.language, status: remoto.status, categoria: remoto.category, componentes: remoto.components as unknown as Prisma.InputJsonValue, ativo: remoto.status === "APPROVED", sincronizadoEm: agora, ...analise },
          update: { identificadorMeta: remoto.id, status: remoto.status, categoria: remoto.category, componentes: remoto.components as unknown as Prisma.InputJsonValue, ativo: remoto.status === "APPROVED", sincronizadoEm: agora, ...analise },
        });
      }
    });
    return { encontrados: remotos.length, aprovados: remotos.filter((item) => item.status === "APPROVED").length, sincronizadoEm: agora };
  }

  async executarTodos(limite = 50) {
    const canais = await this.db.canalMensageria.findMany({
      where: { tipo: "WHATSAPP", ativo: true, statusConexao: "CONECTADO", businessAccountId: { not: null } },
      orderBy: { id: "asc" }, take: Math.min(Math.max(limite, 1), 100), select: { id: true, unidadeId: true },
    });
    let sincronizados = 0; let falhas = 0; let templates = 0;
    for (const canal of canais) {
      try { const resultado = await this.executar(canal.unidadeId, canal.id); sincronizados++; templates += resultado.encontrados; }
      catch { falhas++; }
    }
    return { encontrados: canais.length, sincronizados, falhas, templates };
  }
}
