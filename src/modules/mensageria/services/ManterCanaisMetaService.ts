import type { PrismaClient } from "@prisma/client";
import type { SecretValueProvider, SecretWriteProvider } from "../../../shared/tenant/SecretValueProvider";
import type { ControlPlaneMensageriaClient } from "./ControlPlaneMensageriaClient";
import { DiagnosticarCanalMetaService } from "./DiagnosticarCanalMetaService";
import type { MetaOAuthProvider } from "./MetaOAuthProvider";

export class ManterCanaisMetaService {
  constructor(
    private readonly db: PrismaClient,
    private readonly leitura: SecretValueProvider,
    private readonly escrita: SecretWriteProvider,
    private readonly oauth: MetaOAuthProvider,
    private readonly diretorio: ControlPlaneMensageriaClient,
    _tenantKeyLegado?: string,
  ) {}

  async executar(limite = 50) {
    const agora = new Date();
    const diagnosticoVencido = new Date(agora.getTime() - 24 * 60 * 60_000);
    const canais = await this.db.canalMensageria.findMany({
      where: {
        ativo: true, statusConexao: "CONECTADO",
        OR: [
          { tipo: "INSTAGRAM", proximaRenovacaoEm: { lte: agora } },
          { OR: [{ ultimoDiagnosticoEm: null }, { ultimoDiagnosticoEm: { lte: diagnosticoVencido } }] },
        ],
      },
      orderBy: [{ proximaRenovacaoEm: "asc" }, { ultimoDiagnosticoEm: "asc" }], take: Math.min(Math.max(limite, 1), 100),
      include: { unidade: { select: { conta: { select: { tenantKey: true } } } } },
    });
    let renovados = 0; let diagnosticados = 0; let falhas = 0;
    for (const canal of canais) {
      if (canal.tipo === "INSTAGRAM" && canal.proximaRenovacaoEm && canal.proximaRenovacaoEm <= agora) {
        try {
          const atual = await this.leitura.obter(canal.tokenRef);
          const renovado = await this.oauth.renovarTokenInstagram(atual);
          await this.oauth.validarConta("INSTAGRAM", canal.identificadorExterno, renovado.token);
          await this.oauth.assinarWebhooksInstagram(canal.identificadorExterno, renovado.token);
          await this.escrita.armazenar(canal.tokenRef, renovado.token);
          const proxima = renovado.expiraEm ? new Date(renovado.expiraEm.getTime() - 7 * 24 * 60 * 60_000) : new Date(agora.getTime() + 30 * 24 * 60 * 60_000);
          await this.db.canalMensageria.update({ where: { id: canal.id }, data: {
            tokenExpiraEm: renovado.expiraEm, proximaRenovacaoEm: proxima, ultimoDiagnosticoEm: agora,
            validadoEm: agora, codigoErroConexao: null, tokenVersao: { increment: 1 },
          } });
          renovados++; continue;
        } catch {
          await this.db.canalMensageria.update({ where: { id: canal.id }, data: { codigoErroConexao: "META_RENOVACAO_FALHOU", proximaRenovacaoEm: new Date(agora.getTime() + 6 * 60 * 60_000) } });
          falhas++; continue;
        }
      }
      try {
        await new DiagnosticarCanalMetaService(this.db, this.leitura, this.oauth, this.diretorio, canal.unidade.conta.tenantKey).executar(canal.unidadeId, canal.id);
        diagnosticados++;
      } catch { falhas++; }
    }
    return { encontrados: canais.length, renovados, diagnosticados, falhas };
  }
}
