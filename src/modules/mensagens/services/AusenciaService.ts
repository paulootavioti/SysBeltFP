import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { calcularIdade, formatarTelefoneWhatsapp, type MensagemGerada } from "../utils";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

const DIAS_LIMITE_AUSENCIA = 14;

export class AusenciaService {
  async execute(unidadeId: number | null): Promise<MensagemGerada[]> {
    const prisma = prismaDaRequisicao();
    const dataLimite = new Date();
    dataLimite.setUTCDate(dataLimite.getUTCDate() - DIAS_LIMITE_AUSENCIA);

    const alunos = await prisma.aluno.findMany({
      where: {
        ativo: true,
        turmaId: { not: null },
        ...escopoUnidade(unidadeId),
      },
      include: {
        responsaveis: { where: { ativo: true, recebeComunicados: true } },
        aulas: {
          where: { presente: true },
          include: { aula: { select: { data: true } } },
          orderBy: { aula: { data: "desc" } },
          take: 1,
        },
      },
    });

    const mensagens: MensagemGerada[] = [];

    for (const aluno of alunos) {
      const ultimaPresenca = aluno.aulas[0]?.aula.data;

      const ausente = !ultimaPresenca || ultimaPresenca < dataLimite;

      if (!ausente) continue;

      const nomeExibicao = aluno.apelido || aluno.nome;

      const texto = ultimaPresenca
        ? `Olá! Sentimos a falta de ${nomeExibicao} no tatame — a última presença foi há mais de ${DIAS_LIMITE_AUSENCIA} dias. Está tudo bem? Esperamos vocês em breve! 🥋`
        : `Olá! Notamos que ${nomeExibicao} ainda não compareceu a nenhuma aula. Podemos ajudar com alguma dúvida sobre os horários da turma?`;

      const idade = calcularIdade(aluno.dataNascimento);

      if (idade < 18) {
        const responsavel = aluno.responsaveis[0];
        if (!responsavel) continue;

        mensagens.push({
          alunoId: aluno.id,
          nome: aluno.nome,
          apelido: aluno.apelido,
          destinatario: "RESPONSAVEL",
          nomeDestinatario: responsavel.apelido || responsavel.nome,
          telefone: formatarTelefoneWhatsapp(responsavel.whatsapp || responsavel.telefone),
          mensagem: texto,
        });
      } else {
        mensagens.push({
          alunoId: aluno.id,
          nome: aluno.nome,
          apelido: aluno.apelido,
          destinatario: "ALUNO",
          nomeDestinatario: nomeExibicao,
          telefone: formatarTelefoneWhatsapp(aluno.whatsapp || aluno.telefone),
          mensagem: texto,
        });
      }
    }

    return mensagens;
  }
}
