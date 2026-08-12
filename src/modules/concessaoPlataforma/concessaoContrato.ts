import { createHash, verify } from "node:crypto";
import { z } from "zod";

const RECURSOS = ["WHATSAPP", "GATEWAY_AUTOMATICO", "CONTROLE_ACESSO"] as const;

export const concessaoV1Schema = z.object({
  versao: z.literal(1),
  tenantKey: z.string().uuid(),
  revisao: z.number().int().positive(),
  statusAcesso: z.enum(["ATIVO", "SUSPENSO", "CANCELADO"]),
  recursos: z.array(z.enum(RECURSOS)).max(RECURSOS.length).refine(
    (itens) => new Set(itens).size === itens.length, "Recursos duplicados.",
  ),
  emitidaEm: z.string().datetime({ offset: true }),
  expiraEm: z.string().datetime({ offset: true }),
  assinatura: z.string().min(1),
}).strict();

export type ConcessaoV1 = z.infer<typeof concessaoV1Schema>;

function jsonCanonico(valor: unknown): string {
  if (valor === null || typeof valor !== "object") return JSON.stringify(valor);
  if (Array.isArray(valor)) return `[${valor.map(jsonCanonico).join(",")}]`;
  const objeto = valor as Record<string, unknown>;
  return `{${Object.keys(objeto).sort().map((chave) => `${JSON.stringify(chave)}:${jsonCanonico(objeto[chave])}`).join(",")}}`;
}

export function payloadConcessao(concessao: ConcessaoV1): string {
  const { assinatura: _assinatura, ...payload } = concessao;
  return jsonCanonico(payload);
}

export function validarConcessao(
  entrada: unknown,
  tenantKeyEsperado: string,
  chavePublicaPem: string,
  agora = new Date(),
): { concessao: ConcessaoV1; payloadHash: string } {
  const concessao = concessaoV1Schema.parse(entrada);
  const emitidaEm = new Date(concessao.emitidaEm);
  const expiraEm = new Date(concessao.expiraEm);
  if (concessao.tenantKey !== tenantKeyEsperado) throw new Error("Concessão pertence a outro tenant.");
  if (emitidaEm.getTime() > agora.getTime() + 5 * 60_000) throw new Error("Concessão emitida no futuro.");
  if (expiraEm <= agora || expiraEm <= emitidaEm) throw new Error("Concessão expirada ou inválida.");
  const payload = payloadConcessao(concessao);
  if (!verify(null, Buffer.from(payload), chavePublicaPem, Buffer.from(concessao.assinatura, "base64"))) {
    throw new Error("Assinatura da concessão inválida.");
  }
  return { concessao, payloadHash: createHash("sha256").update(payload).digest("hex") };
}
