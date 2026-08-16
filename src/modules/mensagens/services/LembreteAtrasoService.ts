import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import {
  calcularIdade,
  formatarDataBr,
  formatarTelefoneWhatsapp,
  formatarValorBr,
  type MensagemGerada,
} from "../utils";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

export class LembreteAtrasoService {
  async execute(unidadeId: number | null): Promise<MensagemGerada[]> {
    const prisma = prismaDaRequisicao();
    const hoje = new Date();
    hoje.setUTCHours(0, 0, 0, 0);

    const dataAlvo = new Date(hoje);
    dataAlvo.setUTCDate(dataAlvo.getUTCDate() - 10);

    const proximoDia = new Date(dataAlvo);
    proximoDia.setUTCDate(proximoDia.getUTCDate() + 1);

    const mensalidades = await prisma.mensalidade.findMany({
      where: {
        pago: false,
        vencimento: { gte: dataAlvo, lt: proximoDia },
        ...escopoUnidade(unidadeId),
      },
      include: {
        aluno: {
          include: {
            responsaveis: { where: { ativo: true, recebeComunicados: true } },
          },
        },
      },
    });

    const mensagens: MensagemGerada[] = [];

    for (const mensalidade of mensalidades) {
      const aluno = mensalidade.aluno;
      const nomeExibicao = aluno.apelido || aluno.nome;

      const texto =
        `Olá! Notamos que a mensalidade de ${nomeExibicao}, vencida em ${formatarDataBr(mensalidade.vencimento)} ` +
        `(valor de R$ ${formatarValorBr(mensalidade.valor)}), ainda está em aberto. ` +
        `Poderia verificar a situação, por favor? Qualquer dúvida estamos à disposição.`;

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
