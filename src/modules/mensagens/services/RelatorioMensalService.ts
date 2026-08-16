import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { calcularIdade, formatarTelefoneWhatsapp, type MensagemGerada } from "../utils";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

export class RelatorioMensalService {
  async execute(unidadeId: number | null): Promise<MensagemGerada[]> {
    const prisma = prismaDaRequisicao();
    const hoje = new Date();
    const inicioMes = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), 1));
    const inicioProximoMes = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() + 1, 1));

    const alunos = await prisma.aluno.findMany({
      where: {
        ativo: true,
        turmaId: { not: null },
        ...escopoUnidade(unidadeId),
      },
      include: {
        responsaveis: { where: { ativo: true, recebeComunicados: true } },
        aulas: {
          where: {
            aula: {
              data: { gte: inicioMes, lt: inicioProximoMes },
            },
          },
        },
      },
    });

    const mensagens: MensagemGerada[] = [];
    const nomeMes = hoje.toLocaleDateString("pt-BR", { month: "long" });

    for (const aluno of alunos) {
      if (aluno.aulas.length === 0) continue;

      const nomeExibicao = aluno.apelido || aluno.nome;

      const totalAulas = aluno.aulas.length;
      const presencas = aluno.aulas.filter((a) => a.presente).length;
      const frequencia = Math.round((presencas / totalAulas) * 100);

      const respeito = aluno.aulas.filter((a) => a.respeito).length;
      const esforco = aluno.aulas.filter((a) => a.esforco).length;
      const disciplina = aluno.aulas.filter((a) => a.disciplina).length;

      const texto =
        `Olá! Segue o resumo de ${nomeExibicao} em ${nomeMes}: ` +
        `${presencas} de ${totalAulas} aulas (${frequencia}% de frequência). ` +
        `Destaques de comportamento: respeito em ${respeito} aulas, esforço em ${esforco} aulas e disciplina em ${disciplina} aulas. ` +
        `Continue incentivando essa evolução! 💪🥋`;

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
