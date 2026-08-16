import { prismaDaRequisicao } from "../../shared/database/prismaDaRequisicao";
import { eventoIdDiario, SnapshotContagemV1 } from "./contratoContagem";

type UnidadeAgregada = { id: number; nome: string; ativo: boolean };
type ContagemAgregada = { unidadeId: number; _count: { _all: number } };

export interface FonteContagem {
  listarUnidades(): Promise<UnidadeAgregada[]>;
  contarAlunosAtivos(): Promise<ContagemAgregada[]>;
}

const fontePrisma: FonteContagem = {
  listarUnidades: () => {
    const prisma = prismaDaRequisicao();
    return prisma.unidade.findMany({
      select: { id: true, nome: true, ativo: true }, orderBy: { id: "asc" },
    });
  },
  contarAlunosAtivos: async () => {
    const prisma = prismaDaRequisicao();
    const contagens = await prisma.alunoUnidade.groupBy({
      by: ["unidadeId"],
      where: { aluno: { ativo: true }, unidade: { ativo: true } },
      _count: { _all: true },
    });
    return contagens.map((item) => ({
      unidadeId: item.unidadeId,
      _count: { _all: item._count._all },
    }));
  },
};

function dataEmSaoPaulo(agora: Date): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(agora);
  const obter = (tipo: string) => partes.find((parte) => parte.type === tipo)!.value;
  return `${obter("year")}-${obter("month")}-${obter("day")}`;
}

export class GerarSnapshotContagemService {
  constructor(private readonly fonte: FonteContagem = fontePrisma) {}

  async execute(tenantKey: string, agora = new Date()): Promise<SnapshotContagemV1> {
    const [unidades, contagens] = await Promise.all([
      this.fonte.listarUnidades(), this.fonte.contarAlunosAtivos(),
    ]);
    const porUnidade = new Map(contagens.map((item) => [item.unidadeId, item._count._all]));
    const dataLocal = dataEmSaoPaulo(agora);

    return {
      versao: 1,
      eventoId: eventoIdDiario(tenantKey, dataLocal),
      tenantKey,
      dataCorte: agora.toISOString(),
      unidades: unidades.map((unidade) => ({
        unidadeId: String(unidade.id),
        nomeExibicao: unidade.nome,
        status: unidade.ativo ? "ATIVA" : "ENCERRADA",
        alunosAtivos: unidade.ativo ? (porUnidade.get(unidade.id) ?? 0) : 0,
      })),
    };
  }
}
