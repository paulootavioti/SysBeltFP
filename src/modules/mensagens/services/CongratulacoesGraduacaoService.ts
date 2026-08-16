import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { calcularIdade, formatarTelefoneWhatsapp, type MensagemGerada } from "../utils";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

export class CongratulacoesGraduacaoService {
  async execute(unidadeId: number | null): Promise<MensagemGerada[]> {
    const prisma = prismaDaRequisicao();
    const seteDiasAtras = new Date();
    seteDiasAtras.setUTCDate(seteDiasAtras.getUTCDate() - 7);
    seteDiasAtras.setUTCHours(0, 0, 0, 0);

    const graduacoes = await prisma.graduacao.findMany({
      where: {
        data: { gte: seteDiasAtras },
        ...escopoUnidade(unidadeId),
      },
      include: {
        aluno: {
          include: {
            responsaveis: { where: { ativo: true, recebeComunicados: true } },
          },
        },
      },
      orderBy: { data: "desc" },
    });

    const mensagens: MensagemGerada[] = [];

    for (const graduacao of graduacoes) {
      const aluno = graduacao.aluno;
      const nomeExibicao = aluno.apelido || aluno.nome;

      const texto =
        `Parabéns, ${nomeExibicao}! 🎉🥋 Você conquistou a faixa ${graduacao.faixa}! ` +
        `Essa conquista é resultado de muito esforço e dedicação no tatame. Continue assim!`;

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
