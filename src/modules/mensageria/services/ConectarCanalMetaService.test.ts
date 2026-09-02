import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../../shared/database/prisma";
import { criarUnidadeDeTeste } from "../../../shared/testing/criarUnidadeDeTeste";
import type { SecretWriteProvider } from "../../../shared/tenant/SecretValueProvider";
import type { ControlPlaneMensageriaClient } from "./ControlPlaneMensageriaClient";
import type { MetaOAuthProvider } from "./MetaOAuthProvider";
import { ConectarCanalMetaService } from "./ConectarCanalMetaService";

const SUFIXO = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const TENANT_KEY = "11111111-1111-4111-8111-111111111111";
let unidadeId: number;

beforeAll(async () => {
  unidadeId = (await criarUnidadeDeTeste(`TESTE_ONBOARDING_META_${SUFIXO}`)).id;
  process.env.META_OAUTH_REDIRECT_URI = "https://app.example/atendimento";
  process.env.META_WHATSAPP_VERIFY_TOKEN_REF = "cofre/verify-whatsapp";
  process.env.META_INSTAGRAM_VERIFY_TOKEN_REF = "cofre/verify-instagram";
  process.env.META_TENANT_SECRETS_PREFIX = "cofre/mensageria";
});

afterAll(async () => {
  await prisma.canalMensageria.deleteMany({ where: { unidadeId } });
  await prisma.unidade.delete({ where: { id: unidadeId } });
});

function dependencias(falharDiretorio = false) {
  const gravados: Array<{ ref: string; valor: string }> = [];
  const oauth = {
    trocarCodigo: async () => ({ token: "token-secreto-tenant", appSecretRef: "cofre/app-secret" }),
    validarConta: async () => ({ nomeExibicao: "Academia WhatsApp" }),
    assinarWebhooksWhatsApp: async () => undefined,
  } as unknown as MetaOAuthProvider;
  const cofre: SecretWriteProvider = { armazenar: async (ref, valor) => { gravados.push({ ref, valor }); } };
  const diretorio = { sincronizar: async () => { if (falharDiretorio) throw new Error("indisponível"); } } as unknown as ControlPlaneMensageriaClient;
  return { gravados, oauth, cofre, diretorio };
}

describe("onboarding de canal Meta", () => {
  it("valida, grava o token somente no cofre e ativa após sincronizar", async () => {
    const deps = dependencias();
    const service = new ConectarCanalMetaService(prisma, deps.oauth, deps.cofre, deps.diretorio, TENANT_KEY);
    const identificador = `phone-${SUFIXO}`;
    const resultado = await service.executar({ unidadeId, tipo: "WHATSAPP", identificadorExterno: identificador, codigo: "codigo-oauth", businessAccountId: "waba-123" });
    expect(resultado.statusConexao).toBe("CONECTADO");
    expect(deps.gravados).toEqual([{ ref: `cofre/mensageria/${TENANT_KEY}/whatsapp/${identificador}/access-token`, valor: "token-secreto-tenant" }]);
    const persistido = await prisma.canalMensageria.findUniqueOrThrow({ where: { id: resultado.id } });
    expect(JSON.stringify(persistido)).not.toContain("token-secreto-tenant");
    expect(JSON.stringify(persistido)).not.toContain("codigo-oauth");
  });

  it("não ativa o canal quando o diretório global falha", async () => {
    const deps = dependencias(true);
    const service = new ConectarCanalMetaService(prisma, deps.oauth, deps.cofre, deps.diretorio, TENANT_KEY);
    const identificador = `phone-erro-${SUFIXO}`;
    await expect(service.executar({ unidadeId, tipo: "WHATSAPP", identificadorExterno: identificador, codigo: "codigo", businessAccountId: "waba-123" })).rejects.toMatchObject({ statusCode: 503 });
    expect(await prisma.canalMensageria.findUnique({ where: { tipo_identificadorExterno: { tipo: "WHATSAPP", identificadorExterno: identificador } } })).toMatchObject({ ativo: false, statusConexao: "ERRO", codigoErroConexao: "DIRETORIO_INDISPONIVEL" });
  });

  it("descobre o identificador do Instagram sem aceitá-lo do navegador", async () => {
    const deps = dependencias();
    deps.oauth = {
      trocarCodigo: async () => ({ token: "token-instagram", appSecretRef: "cofre/instagram-app", identificadorExterno: `ig-${SUFIXO}` }),
      validarConta: async () => ({ nomeExibicao: "Instagram Academia" }), assinarWebhooksInstagram: async () => undefined,
    } as unknown as MetaOAuthProvider;
    const service = new ConectarCanalMetaService(prisma, deps.oauth, deps.cofre, deps.diretorio, TENANT_KEY);
    const resultado = await service.executar({ unidadeId, tipo: "INSTAGRAM", identificadorExterno: "", codigo: "codigo-instagram" });
    expect(resultado).toMatchObject({ tipo: "INSTAGRAM", nomeExibicao: "Instagram Academia", statusConexao: "CONECTADO" });
  });
});
