import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { calcularIdade, formatarDataBr, formatarTelefoneWhatsapp, type MensagemGerada } from "../utils";

export class AvisoCancelamentoAulaService {
  async execute(turmaId: number, dataAula: Date): Promise<MensagemGerada[]> {
    const turma = await prisma.turma.findUnique({ where: { id: turmaId } });

    if (!turma) {
      throw new AppError("Turma não encontrada.", 404);
    }

    const alunos = await prisma.aluno.findMany({
      where: { turmaId, ativo: true },
      include: {
        responsaveis: { where: { ativo: true, recebeComunicados: true } },
      },
    });

    const dataFormatada = formatarDataBr(dataAula);
    const mensagens: MensagemGerada[] = [];

    for (const aluno of alunos) {
      const nomeExibicao = aluno.apelido || aluno.nome;

      const texto =
        `Olá! Passando para avisar que a aula de Jiu-Jitsu de ${nomeExibicao} (turma ${turma.nome}) ` +
        `do dia ${dataFormatada} foi cancelada. Desculpe o transtorno — até a próxima aula! 🥋`;

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
