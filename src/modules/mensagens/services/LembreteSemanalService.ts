import { prisma } from "../../../shared/database/prisma";
import { calcularIdade, formatarTelefoneWhatsapp, type MensagemGerada } from "../utils";
import { formatarDiasSemana } from "../../../shared/utils/diasSemana";

export class LembreteSemanalService {
  async execute(): Promise<MensagemGerada[]> {
    const alunos = await prisma.aluno.findMany({
      where: {
        ativo: true,
        turmaId: { not: null },
      },
      include: {
        turma: true,
        responsaveis: {
          where: { ativo: true, recebeComunicados: true },
        },
      },
    });

    const mensagens: MensagemGerada[] = [];

    for (const aluno of alunos) {
      if (!aluno.turma) continue;

      const nomeExibicao = aluno.apelido || aluno.nome;

      const texto =
        `Olá! Passando para lembrar que essa semana ${nomeExibicao} tem treino de Jiu-Jitsu ` +
        `${formatarDiasSemana(aluno.turma.diasSemana)}, das ${aluno.turma.horarioInicio} às ${aluno.turma.horarioFim}. ` +
        `Contamos com a presença! 🥋`;

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
