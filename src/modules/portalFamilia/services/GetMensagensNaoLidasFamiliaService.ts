import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";

export interface NaoLidasPorAluno {
  alunoId: number;
  naoLidas: number;
}

// contagem de mensagens da ACADEMIA ainda não lidas, por aluno do escopo
// da sessão — alimenta o indicador nos chips do seletor de filho e na
// aba Mensagens do Portal da Família.
export class GetMensagensNaoLidasFamiliaService {
  async execute(alunoIds: number[]): Promise<NaoLidasPorAluno[]> {
    const prisma = prismaDaRequisicao();
    if (alunoIds.length === 0) return [];

    const agrupado = await prisma.mensagemFamilia.groupBy({
      by: ["alunoId"],
      where: { alunoId: { in: alunoIds }, remetenteTipo: "ACADEMIA", lida: false },
      _count: { _all: true },
    });

    return agrupado.map((item) => ({ alunoId: item.alunoId, naoLidas: item._count._all }));
  }
}
