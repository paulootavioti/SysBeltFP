import { AppError } from "../../../shared/errors/AppError";

// Todo endpoint do portal recebe um alunoId por parâmetro — este helper
// garante que o aluno pedido é de fato um dos vinculados à sessão da
// família (req.familia.alunoIds), sem revelar se o aluno existe pra quem
// não tem vínculo com ele.
export function garantirAlunoNoEscopo(alunoIds: number[], alunoId: number) {
  if (!alunoIds.includes(alunoId)) {
    throw new AppError("Aluno não encontrado.", 404);
  }
}
