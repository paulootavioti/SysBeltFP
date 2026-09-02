import type { PrismaClient } from "@prisma/client";
import { AppError } from "../../../shared/errors/AppError";
import type { SecretValueProvider } from "../../../shared/tenant/SecretValueProvider";
import type { ControlPlaneMensageriaClient } from "./ControlPlaneMensageriaClient";
import type { MetaOAuthProvider } from "./MetaOAuthProvider";

export class DiagnosticarCanalMetaService {
  constructor(
    private readonly db: PrismaClient,
    private readonly segredos: SecretValueProvider,
    private readonly oauth: MetaOAuthProvider,
    private readonly diretorio: ControlPlaneMensageriaClient,
    private readonly tenantKey: string,
  ) {}

  async executar(unidadeId: number, canalId: number) {
    const canal = await this.db.canalMensageria.findFirst({ where: { id: canalId, unidadeId } });
    if (!canal) throw new AppError("Canal não encontrado.", 404);
    const appSecretRef = (canal.tipo === "INSTAGRAM" ? process.env.META_INSTAGRAM_APP_SECRET_REF : undefined)?.trim() || process.env.META_APP_SECRET_REF?.trim();
    if (!appSecretRef || !this.tenantKey) throw new AppError("Diagnóstico Meta não configurado neste ambiente.", 503);
    await this.db.canalMensageria.update({ where: { id: canal.id }, data: { statusConexao: "VALIDANDO", codigoErroConexao: null } });
    try {
      const token = await this.segredos.obter(canal.tokenRef);
      await this.oauth.validarConta(canal.tipo, canal.identificadorExterno, token);
      if (canal.tipo === "INSTAGRAM") await this.oauth.assinarWebhooksInstagram(canal.identificadorExterno, token);
      await this.diretorio.sincronizar({ tenantKey: this.tenantKey, tipo: canal.tipo, identificadorExterno: canal.identificadorExterno, appSecretRef, ativo: true });
      const agora = new Date();
      return await this.db.canalMensageria.update({ where: { id: canal.id }, data: { ativo: true, statusConexao: "CONECTADO", validadoEm: agora, sincronizadoEm: agora, ultimoDiagnosticoEm: agora, codigoErroConexao: null } });
    } catch (erro) {
      const codigo = erro instanceof Error && /^(META|SEGREDO|DIRETORIO)_[A-Z0-9_]+$/.test(erro.message) ? erro.message : "DIAGNOSTICO_INDISPONIVEL";
      try { await this.diretorio.sincronizar({ tenantKey: this.tenantKey, tipo: canal.tipo, identificadorExterno: canal.identificadorExterno, appSecretRef, ativo: false }); } catch { /* A inativação local continua bloqueando o processamento. */ }
      await this.db.canalMensageria.update({ where: { id: canal.id }, data: { ativo: false, statusConexao: "ERRO", codigoErroConexao: codigo, ultimoDiagnosticoEm: new Date() } });
      throw new AppError("A conexão Meta precisa ser reconectada.", 422);
    }
  }
}
