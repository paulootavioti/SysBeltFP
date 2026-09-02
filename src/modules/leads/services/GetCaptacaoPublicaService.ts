import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { TEXTO_CONSENTIMENTO_COMUNICACOES, TEXTO_CONSENTIMENTO_DADOS, VERSAO_CONSENTIMENTO_LEAD } from "../consentimentos";

export class GetCaptacaoPublicaService {
  async execute(slug: string) {
    const canal = await prismaDaRequisicao().canalCaptacao.findFirst({
      where: { slug, ativo: true, unidade: { ativo: true, conta: { ativo: true } } },
      select: {
        nome: true,
        unidade: {
          select: {
            nome: true,
            conta: { select: { nome: true } },
            modalidades: {
              where: { ativo: true },
              select: { id: true, nome: true, publicoAlvo: true },
              orderBy: [{ ordem: "asc" }, { nome: "asc" }],
            },
          },
        },
      },
    });
    if (!canal) throw new AppError("Página de captação não encontrada.", 404);

    return {
      academia: canal.unidade.conta.nome,
      unidade: canal.unidade.nome,
      canal: canal.nome,
      modalidades: canal.unidade.modalidades,
      consentimentos: {
        versao: VERSAO_CONSENTIMENTO_LEAD,
        tratamentoDados: TEXTO_CONSENTIMENTO_DADOS,
        comunicacoes: TEXTO_CONSENTIMENTO_COMUNICACOES,
      },
    };
  }
}
