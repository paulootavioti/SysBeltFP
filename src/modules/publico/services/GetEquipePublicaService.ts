import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { obterUnidadePublicaId } from "../../../shared/utils/unidadePublica";

export class GetEquipePublicaService {
  async execute() {
    const prisma = prismaDaRequisicao();
    const unidadeId = obterUnidadePublicaId();

    const professores = await prisma.usuario.findMany({
      where: { unidadeId, perfil: "PROFESSOR", ativo: true },
      select: { id: true, nome: true, apelido: true, nivelGraduacao: true, fotoUrl: true },
      orderBy: { nome: "asc" },
    });

    return professores.map((professor) => ({
      id: professor.id,
      nome: professor.apelido || professor.nome,
      faixa: professor.nivelGraduacao,
      fotoUrl: professor.fotoUrl,
    }));
  }
}
