import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { obterUnidadePublicaId } from "../../../shared/utils/unidadePublica";

// Antes era uma lista fixa em código: mudar a vitrine da landing exigia
// deploy. Agora vem do cadastro de Modalidade da unidade pública — a
// academia liga `visivelNaLanding` na tela de Modalidades e o card aparece.
export class GetModalidadesPublicoService {
  async execute() {
    const prisma = prismaDaRequisicao();
    const unidadeId = obterUnidadePublicaId();

    const modalidades = await prisma.modalidade.findMany({
      where: { unidadeId, ativo: true, visivelNaLanding: true },
      orderBy: [{ ordem: "asc" }, { nome: "asc" }],
      select: { id: true, nome: true, publicoAlvo: true, descricao: true },
    });

    // o contrato com landing-academia/script.js é { id, nome, publico,
    // descricao } — mantido pra não exigir deploy do site estático junto.
    return modalidades.map((modalidade) => ({
      id: String(modalidade.id),
      nome: modalidade.nome,
      publico: modalidade.publicoAlvo ?? "",
      descricao: modalidade.descricao ?? "",
    }));
  }
}
