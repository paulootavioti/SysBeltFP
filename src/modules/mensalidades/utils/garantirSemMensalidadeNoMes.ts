import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";

export async function garantirSemMensalidadeNoMes(alunoId: number, vencimento: string) {
  const dataVencimento = new Date(vencimento);
  const mes = dataVencimento.getMonth();
  const ano = dataVencimento.getFullYear();

  const mensalidadesAluno = await prisma.mensalidade.findMany({
    where: { alunoId },
  });

  const mensalidadeExistente = mensalidadesAluno.find((item) => {
    const data = new Date(item.vencimento);
    return data.getMonth() === mes && data.getFullYear() === ano;
  });

  if (mensalidadeExistente) {
    throw new AppError("Já existe uma mensalidade para este aluno neste mês.");
  }
}
