import { createHash, sign } from "node:crypto";

export type SnapshotContagemV1 = {
  versao: 1;
  eventoId: string;
  tenantKey: string;
  dataCorte: string;
  unidades: Array<{
    unidadeId: string;
    nomeExibicao: string;
    status: "ATIVA" | "ENCERRADA";
    alunosAtivos: number;
  }>;
};

function jsonCanonico(valor: unknown): string {
  if (valor === null || typeof valor !== "object") return JSON.stringify(valor);
  if (Array.isArray(valor)) return `[${valor.map(jsonCanonico).join(",")}]`;
  const objeto = valor as Record<string, unknown>;
  return `{${Object.keys(objeto).sort().map((chave) => `${JSON.stringify(chave)}:${jsonCanonico(objeto[chave])}`).join(",")}}`;
}

export function eventoIdDiario(tenantKey: string, dataLocal: string): string {
  const bytes = Buffer.from(createHash("sha256").update(`${tenantKey}:contagem:v1:${dataLocal}`).digest().subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function assinarSnapshot(
  payload: SnapshotContagemV1,
  timestamp: string,
  chavePrivadaPem: string,
): string {
  return sign(
    null,
    Buffer.from(`${timestamp}.${jsonCanonico(payload)}`),
    chavePrivadaPem,
  ).toString("base64");
}
