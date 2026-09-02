import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { escopoUnidade, garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

function slugValido(slug: string) {
  return slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export class CanalCaptacaoService {
  listar(unidadeId: number | null) {
    return prismaDaRequisicao().canalCaptacao.findMany({
      where: escopoUnidade(unidadeId),
      orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    });
  }

  async criar(unidadeId: number, dados: { nome: string; slug: string }) {
    const slug = slugValido(dados.slug);
    if (slug.length < 3) throw new AppError("Informe um slug com pelo menos 3 caracteres.");
    try {
      return await prismaDaRequisicao().canalCaptacao.create({ data: { unidadeId, nome: dados.nome.trim(), slug } });
    } catch (erro) {
      if (typeof erro === "object" && erro && "code" in erro && erro.code === "P2002") throw new AppError("Já existe um canal com este nome ou slug.");
      throw erro;
    }
  }

  async atualizar(id: number, unidadeId: number | null, dados: { nome: string; slug: string; ativo: boolean }) {
    const atual = await prismaDaRequisicao().canalCaptacao.findUnique({ where: { id } });
    if (!atual) throw new AppError("Canal não encontrado.", 404);
    garantirAcessoUnidade(unidadeId, atual.unidadeId, "Canal não encontrado.");
    const slug = slugValido(dados.slug);
    if (slug.length < 3) throw new AppError("Informe um slug com pelo menos 3 caracteres.");
    try {
      return await prismaDaRequisicao().canalCaptacao.update({ where: { id }, data: { nome: dados.nome.trim(), slug, ativo: dados.ativo } });
    } catch (erro) {
      if (typeof erro === "object" && erro && "code" in erro && erro.code === "P2002") throw new AppError("Já existe um canal com este nome ou slug.");
      throw erro;
    }
  }
}
