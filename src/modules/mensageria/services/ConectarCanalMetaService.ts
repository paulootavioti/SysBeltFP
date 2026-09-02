import { PrismaClient, TipoCanalMensageria } from "@prisma/client";
import { AppError } from "../../../shared/errors/AppError";
import type { SecretWriteProvider } from "../../../shared/tenant/SecretValueProvider";
import type { ControlPlaneMensageriaClient } from "./ControlPlaneMensageriaClient";
import type { MetaOAuthProvider } from "./MetaOAuthProvider";

export class ConectarCanalMetaService {
  constructor(
    private readonly db: PrismaClient,
    private readonly oauth: MetaOAuthProvider,
    private readonly cofre: SecretWriteProvider,
    private readonly diretorio: ControlPlaneMensageriaClient,
    private readonly tenantKey: string,
  ) {}

  async executar(dados: { unidadeId: number; tipo: TipoCanalMensageria; identificadorExterno: string; codigo: string; businessAccountId?: string }) {
    let identificador = dados.identificadorExterno.trim();
    const codigo = dados.codigo.trim();
    if ((dados.tipo === "WHATSAPP" && !identificador) || identificador.length > 200 || !codigo || codigo.length > 2_000) throw new AppError("Dados de conexão Meta inválidos.");
    const redirectUri = process.env.META_OAUTH_REDIRECT_URI?.trim();
    const verifyTokenRef = process.env[`META_${dados.tipo}_VERIFY_TOKEN_REF`]?.trim();
    const prefixo = process.env.META_TENANT_SECRETS_PREFIX?.trim();
    if (!redirectUri || !verifyTokenRef || !prefixo || !this.tenantKey) throw new AppError("Onboarding Meta não configurado neste ambiente.", 503);

    let token = "";
    let appSecretRef = "";
    let nomeExibicao = "";
    let expiraEm: Date | null = null;
    try {
      const troca = await this.oauth.trocarCodigo(codigo, redirectUri, dados.tipo);
      token = troca.token; appSecretRef = troca.appSecretRef;
      expiraEm = troca.expiraEm;
      identificador ||= "identificadorExterno" in troca ? troca.identificadorExterno : "";
      if (!identificador) throw new Error("META_CONTA_INACESSIVEL");
      nomeExibicao = (await this.oauth.validarConta(dados.tipo, identificador, token)).nomeExibicao;
      if (dados.tipo === "WHATSAPP") await this.oauth.assinarWebhooksWhatsApp(dados.businessAccountId?.trim() || "", identificador, token);
      else await this.oauth.assinarWebhooksInstagram(identificador, token);
    } catch (erro) {
      const codigoErro = erro instanceof Error && /^META_[A-Z0-9_]+$/.test(erro.message) ? erro.message : "META_INDISPONIVEL";
      throw new AppError("Não foi possível validar a conta na Meta.", 422);
    }

    const conflito = await this.db.canalMensageria.findUnique({ where: { tipo_identificadorExterno: { tipo: dados.tipo, identificadorExterno: identificador } } });
    if (conflito && conflito.unidadeId !== dados.unidadeId) throw new AppError("Esta conta Meta já está vinculada a outra unidade.", 409);

    const tokenRef = `${prefixo.replace(/\/$/, "")}/${this.tenantKey}/${dados.tipo.toLowerCase()}/${identificador}/access-token`;
    await this.cofre.armazenar(tokenRef, token);
    const canal = await this.db.canalMensageria.upsert({
      where: { tipo_identificadorExterno: { tipo: dados.tipo, identificadorExterno: identificador } },
      create: { unidadeId: dados.unidadeId, tipo: dados.tipo, identificadorExterno: identificador, businessAccountId: dados.tipo === "WHATSAPP" ? dados.businessAccountId?.trim() : null, nomeExibicao, tokenRef, verifyTokenRef, ativo: false, statusConexao: "VALIDANDO" },
      update: { nomeExibicao, tokenRef, verifyTokenRef, businessAccountId: dados.tipo === "WHATSAPP" ? dados.businessAccountId?.trim() : null, ativo: false, statusConexao: "VALIDANDO", codigoErroConexao: null },
    });
    try {
      await this.diretorio.sincronizar({ tenantKey: this.tenantKey, tipo: dados.tipo, identificadorExterno: identificador, appSecretRef, ativo: true });
    } catch {
      await this.db.canalMensageria.update({ where: { id: canal.id }, data: { statusConexao: "ERRO", codigoErroConexao: "DIRETORIO_INDISPONIVEL" } });
      throw new AppError("Conta validada, mas não foi possível sincronizar o diretório. Tente novamente.", 503);
    }
    const agora = new Date();
    const proximaRenovacaoEm = dados.tipo === "INSTAGRAM" && expiraEm
      ? new Date(Math.max(agora.getTime() + 24 * 60 * 60_000, expiraEm.getTime() - 7 * 24 * 60 * 60_000)) : null;
    return this.db.canalMensageria.update({
      where: { id: canal.id },
      data: { ativo: true, statusConexao: "CONECTADO", codigoErroConexao: null, validadoEm: agora, sincronizadoEm: agora, ultimoDiagnosticoEm: agora, tokenExpiraEm: expiraEm, proximaRenovacaoEm, tokenVersao: { increment: conflito ? 1 : 0 } },
      select: { id: true, tipo: true, nomeExibicao: true, ativo: true, statusConexao: true, validadoEm: true, sincronizadoEm: true },
    });
  }

  async desativar(unidadeId: number, canalId: number, appSecretRef: string) {
    const canal = await this.db.canalMensageria.findFirst({ where: { id: canalId, unidadeId } });
    if (!canal) throw new AppError("Canal não encontrado.", 404);
    await this.diretorio.sincronizar({ tenantKey: this.tenantKey, tipo: canal.tipo, identificadorExterno: canal.identificadorExterno, appSecretRef, ativo: false });
    return this.db.canalMensageria.update({ where: { id: canal.id }, data: { ativo: false, statusConexao: "INATIVO", codigoErroConexao: null, sincronizadoEm: new Date() } });
  }
}
