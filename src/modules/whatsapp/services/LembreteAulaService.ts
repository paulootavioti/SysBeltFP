import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { fimDoDiaUTC, inicioDoDiaUTC } from "../../../shared/utils/dataCalendario";
import { EnviarMensagemWhatsappService } from "./EnviarMensagemWhatsappService";
import { contabilizar, type ResultadoRegua } from "./ReguaCobrancaService";
import { destinatarioDoAluno, primeiroNome } from "../utils/destinatario";

/**
 * Lembrete das aulas de hoje, para os alunos da turma.
 *
 * Roda pelo cron de manhã. A chave de idempotência é a aula + o aluno, e
 * não a rodada: rodar de novo no mesmo dia não manda dois lembretes, e no
 * dia seguinte a aula é outra, então o aviso volta a sair.
 */
export class LembreteAulaService {
  private readonly enviar = new EnviarMensagemWhatsappService();

  async execute(hoje: Date = new Date(), unidadeId?: number): Promise<ResultadoRegua> {
    const prisma = prismaDaRequisicao();
    const contador: ResultadoRegua = {
      avaliadas: 0,
      enviadas: 0,
      jaAvisadas: 0,
      semConsentimento: 0,
      semTelefone: 0,
      semRecurso: 0,
      falharam: 0,
    };

    // `data` da aula é data de calendário (meia-noite UTC). O intervalo do
    // dia é calculado em UTC pelo mesmo motivo: em Brasília, `new Date()`
    // depois das 21h já é "amanhã" em UTC, e um intervalo montado com
    // acessores locais pularia as aulas do próprio dia.
    const aulas = await prisma.aulaProgramada.findMany({
      where: {
        data: { gte: inicioDoDiaUTC(hoje), lte: fimDoDiaUTC(hoje) },
        status: { not: "CANCELADA" },
        ...(unidadeId ? { unidadeId } : {}),
      },
      include: {
        turma: {
          select: {
            nome: true,
            horarioInicio: true,
            alunos: { select: { id: true, nome: true, ativo: true } },
          },
        },
      },
    });

    for (const aula of aulas) {
      for (const aluno of aula.turma.alunos) {
        // Aluno desativado saiu da academia — continuar lembrando dele da
        // aula é constrangedor pra academia e pra família.
        if (!aluno.ativo) continue;

        contador.avaliadas++;

        const destinatario = await destinatarioDoAluno(aluno.id);

        if (!destinatario) {
          contador.semTelefone++;
          continue;
        }

        const { resultado } = await this.enviar.execute({
          unidadeId: aula.unidadeId,
          template: "LEMBRETE_AULA",
          parametros: [
            primeiroNome(aluno.nome),
            aula.turma.nome,
            aula.turma.horarioInicio,
          ],
          telefone: destinatario.telefone,
          alunoId: aluno.id,
          responsavelId: destinatario.responsavelId,
          chaveIdempotencia: `lembrete-aula-${aula.id}-aluno-${aluno.id}`,
        });

        contabilizar(contador, resultado);
      }
    }

    return contador;
  }
}
