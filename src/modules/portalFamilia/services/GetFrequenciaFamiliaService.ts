import { prisma } from "../../../shared/database/prisma";
import { assinarUrlFoto } from "../../uploads/services/assinarUrlFoto";

export class GetFrequenciaFamiliaService {
  async execute(alunoId: number) {
    const registros = await prisma.aulaAluno.findMany({
      where: { alunoId },
      include: {
        aula: {
          include: {
            turma: true,
            // só entra na resposta quando o aluno esteve presente (checagem
            // abaixo) — faltas nunca recebem foto, mesmo que a aula tenha.
            fotos: { select: { id: true, url: true, legenda: true }, orderBy: { publicadaEm: "desc" } },
          },
        },
      },
      orderBy: {
        aula: { data: "desc" },
      },
    });

    return registros.map((registro) => ({
      id: registro.id,
      data: registro.aula.data,
      turmaNome: registro.aula.turma?.nome ?? null,
      presente: registro.presente,
      // url assinada: o Portal da Família roda em outro domínio e exibe a
      // foto com <img>, que não manda header de autenticação.
      fotos: registro.presente
        ? registro.aula.fotos.map((foto) => ({ ...foto, url: assinarUrlFoto(foto.url) }))
        : [],
    }));
  }
}
