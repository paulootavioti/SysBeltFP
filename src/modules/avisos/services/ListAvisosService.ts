import { prisma } from "../../../shared/database/prisma";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

export interface Aviso {
  tipo: string;
  referenciaId: number;
  titulo: string;
  descricao: string;
  dataReferencia: string;
}

function formatarDataBr(data: Date): string {
  return data.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function formatarValorBr(valor: number): string {
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export class ListAvisosService {
  async execute(usuarioId: number, unidadeId: number | null): Promise<Aviso[]> {
    const [mensalidadesVencidas, pedidosAguardandoRetirada, reconhecidos] = await Promise.all([
      prisma.mensalidade.findMany({
        where: {
          pago: false,
          vencimento: { lt: new Date() },
          ...escopoUnidade(unidadeId),
        },
        include: { aluno: true },
        orderBy: { vencimento: "asc" },
      }),
      prisma.pedido.findMany({
        where: { status: "AGUARDANDO_RETIRADA", ...escopoUnidade(unidadeId) },
        include: { aluno: true },
        orderBy: { criadoEm: "asc" },
      }),
      prisma.avisoReconhecido.findMany({
        where: { usuarioId },
        select: { tipo: true, referenciaId: true },
      }),
    ]);

    const reconhecidosSet = new Set(
      reconhecidos.map((r) => `${r.tipo}:${r.referenciaId}`)
    );

    const avisos: Aviso[] = [
      ...mensalidadesVencidas
        .filter((m) => !reconhecidosSet.has(`MENSALIDADE_VENCIDA:${m.id}`))
        .map((m) => ({
          tipo: "MENSALIDADE_VENCIDA",
          referenciaId: m.id,
          titulo: "Mensalidade vencida",
          descricao: `${m.aluno.apelido || m.aluno.nome} — vencida em ${formatarDataBr(
            m.vencimento
          )} — R$ ${formatarValorBr(m.valor)}`,
          dataReferencia: m.vencimento.toISOString(),
        })),
      ...pedidosAguardandoRetirada
        .filter((p) => !reconhecidosSet.has(`PEDIDO_AGUARDANDO_RETIRADA:${p.id}`))
        .map((p) => ({
          tipo: "PEDIDO_AGUARDANDO_RETIRADA",
          referenciaId: p.id,
          titulo: "Pedido aguardando retirada",
          descricao: `Pedido #${p.id} — ${p.aluno.apelido || p.aluno.nome} — R$ ${formatarValorBr(p.total)}`,
          dataReferencia: p.criadoEm.toISOString(),
        })),
    ];

    return avisos;
  }
}
