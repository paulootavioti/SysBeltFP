import { assinarSnapshot } from "./contratoContagem";
import { GerarSnapshotContagemService } from "./GerarSnapshotContagemService";
import { prismaDaRequisicao } from "../../shared/database/prismaDaRequisicao";

function variavelObrigatoria(nome: string): string {
  const valor = process.env[nome]?.trim();
  if (!valor) throw new Error(`${nome} não configurada.`);
  return valor.replace(/\\n/g, "\n");
}

export class EnviarSnapshotContagemService {
  constructor(private readonly gerar = new GerarSnapshotContagemService()) {}

  async execute(): Promise<Array<{ tenantKey: string; eventoId?: string; duplicado?: boolean; erro?: string }>> {
    const chavePrivada = variavelObrigatoria("TENANT_INTEGRATION_PRIVATE_KEY");
    const controlPlaneUrl = variavelObrigatoria("CONTROL_PLANE_URL").replace(/\/$/, "");
    const contas = await prismaDaRequisicao().conta.findMany({ where: { ativo: true }, select: { tenantKey: true }, orderBy: { id: "asc" } });
    const resultados: Array<{ tenantKey: string; eventoId?: string; duplicado?: boolean; erro?: string }> = [];
    for (const conta of contas) {
      try {
        resultados.push({ tenantKey: conta.tenantKey, ...(await this.enviar(conta.tenantKey, chavePrivada, controlPlaneUrl)) });
      } catch { resultados.push({ tenantKey: conta.tenantKey, erro: "FALHA_NO_SNAPSHOT" }); }
    }
    return resultados;
  }

  private async enviar(tenantKey: string, chavePrivada: string, controlPlaneUrl: string) {
    const payload = await this.gerar.execute(tenantKey);
    if (payload.unidades.length === 0) throw new Error("Conta sem unidades; snapshot não enviado.");

    const timestamp = new Date().toISOString();
    const resposta = await fetch(`${controlPlaneUrl}/api/integracao/v1/contagens`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-sysbelt-timestamp": timestamp,
        "x-sysbelt-signature": assinarSnapshot(payload, timestamp, chavePrivada),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });

    if (!resposta.ok) {
      throw new Error(`Control Plane recusou snapshot com status ${resposta.status}.`);
    }
    const resultado = await resposta.json() as { duplicado: boolean };
    return { eventoId: payload.eventoId, duplicado: resultado.duplicado };
  }
}
