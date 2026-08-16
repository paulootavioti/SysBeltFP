import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { formatarDiasSemana } from "../../../shared/utils/diasSemana";
import { obterUnidadePublicaId } from "../../../shared/utils/unidadePublica";

// Grade "estática" de turmas (não instâncias de aula) — o que a landing
// precisa mostrar é a oferta semanal fixa da unidade, não o calendário de
// aulas já dadas/a dar (isso é o que GetGradeSemanalService faz, pra uso
// interno autenticado).
export class GetHorariosPublicoService {
  async execute() {
    const prisma = prismaDaRequisicao();
    const unidadeId = obterUnidadePublicaId();

    const turmas = await prisma.turma.findMany({
      where: { unidadeId, ativo: true },
      select: { id: true, nome: true, faixaEtaria: true, diasSemana: true, horarioInicio: true, horarioFim: true },
      orderBy: { horarioInicio: "asc" },
    });

    return turmas.map((turma) => ({
      id: turma.id,
      nome: turma.nome,
      faixaEtaria: turma.faixaEtaria,
      dias: formatarDiasSemana(turma.diasSemana),
      horarioInicio: turma.horarioInicio,
      horarioFim: turma.horarioFim,
    }));
  }
}
