import { assinarSnapshot } from "./contratoContagem";
import { GerarSnapshotContagemService } from "./GerarSnapshotContagemService";
import { prismaDaRequisicao } from "../../shared/database/prismaDaRequisicao";

export function codigoSeguroSnapshot(erro: unknown): string {
  const mensagem = erro instanceof Error ? erro.message : "";
  if (mensagem.includes("TENANT_INTEGRATION_PRIVATE_KEY não configurada")) return "CHAVE_PRIVADA_AUSENTE";
  if (mensagem.includes("CONTROL_PLANE_URL não configurada")) return "URL_CONTROL_PLANE_AUSENTE";
  if (mensagem === "CHAVE_PRIVADA_INVALIDA") return mensagem;
  if (mensagem.includes("Conta sem unidades")) return "CONTA_SEM_UNIDADES";
  const status = mensagem.match(/Control Plane recusou snapshot com status (\d{3})/);
  return status ? `CONTROL_PLANE_HTTP_${status[1]}` : "FALHA_NO_SNAPSHOT";
}

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
      } catch (erro) { resultados.push({ tenantKey: conta.tenantKey, erro: codigoSeguroSnapshot(erro) }); }
    }
    return resultados;
  }

  private async enviar(tenantKey: string, chavePrivada: string, controlPlaneUrl: string) {
    const payload = await this.gerar.execute(tenantKey);
    if (payload.unidades.length === 0) throw new Error("Conta sem unidades; snapshot não enviado.");

    const timestamp = new Date().toISOString();
    let assinatura: string;
    try { assinatura = assinarSnapshot(payload, timestamp, chavePrivada); }
    catch { throw new Error("CHAVE_PRIVADA_INVALIDA"); }
    const resposta = await fetch(`${controlPlaneUrl}/api/integracao/v1/contagens`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-sysbelt-timestamp": timestamp,
        "x-sysbelt-signature": assinatura,
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
