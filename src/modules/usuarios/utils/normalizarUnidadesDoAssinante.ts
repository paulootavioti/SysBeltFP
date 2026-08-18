import { AppError } from "../../../shared/errors/AppError";

// Quais unidades quem está cadastrando pode atribuir a outra pessoa: as da
// própria conta, nunca as de outro assinante.
//
// O alcance vem pronto do contexto da requisição (`unidadesDoUsuario`,
// resolvido em `ensureAuthenticated`) em vez de ser deduzido da unidade
// ATIVA. A diferença importa para o DONO, que trabalha sem unidade ativa
// (RN-164): deduzir da unidade ativa o deixava sem alcance nenhum, e ele não
// conseguia cadastrar ninguém.
export async function normalizarUnidadesDoAssinante(
  valor: unknown,
  unidadesDoAtor: number[]
): Promise<number[] | undefined> {
  if (!Array.isArray(valor)) return undefined;

  if (unidadesDoAtor.length === 0) {
    throw new AppError("Selecione uma unidade ativa.");
  }

  const ids = [...new Set(valor.map(Number).filter((id) => Number.isInteger(id) && id > 0))];

  if (ids.some((id) => !unidadesDoAtor.includes(id))) {
    throw new AppError("Uma ou mais unidades não pertencem à sua academia.", 403);
  }

  return ids;
}
