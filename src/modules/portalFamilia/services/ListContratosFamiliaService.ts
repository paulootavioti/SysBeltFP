import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";

export class ListContratosFamiliaService {
  async execute(alunoId: number) {
    const prisma = prismaDaRequisicao();

    return prisma.contrato.findMany({
      where: {
        alunoId,
        situacao: { not: "RASCUNHO" },
      },
      select: {
        id: true,
        numero: true,
        valor: true,
        dataInicioVigencia: true,
        dataFimVigencia: true,
        situacao: true,
        conteudoGerado: true,
        tipoAssinatura: true,
        assinadoEm: true,
        contratoAssinadoUrl: true,
        createdAt: true,
        modeloContrato: { select: { nome: true, versao: true } },
        solicitacoesAssinatura: {
          where: { status: { in: ["PENDENTE", "CONCLUIDO"] } },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            status: true,
            linkAssinatura: true,
            documentoAssinadoUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
