import { AppError } from "../../../shared/errors/AppError";
import {
  contaDaUnidade,
  garantirUnidadesDaMesmaConta,
} from "../../../shared/utils/contaDoUsuario";

export async function normalizarUnidadesDoAssinante(
  valor: unknown,
  unidadeAtivaId: number | null
): Promise<number[] | undefined> {
  if (!Array.isArray(valor)) return undefined;
  if (!unidadeAtivaId) throw new AppError("Selecione uma unidade ativa.");

  const ids = [...new Set(valor.map(Number).filter((id) => Number.isInteger(id) && id > 0))];
  const [contaAtor, contaSolicitada] = await Promise.all([
    contaDaUnidade(unidadeAtivaId),
    garantirUnidadesDaMesmaConta(ids),
  ]);

  if (contaSolicitada !== null && contaSolicitada !== contaAtor) {
    throw new AppError("Uma ou mais unidades não pertencem à sua academia.", 403);
  }

  return ids;
}
