import { compare, hash } from "bcryptjs";

import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";

export class AlterarSenhaFamiliaService {
  async execute(email: string, senhaAtual: string, novaSenha: string) {
    const prisma = prismaDaRequisicao();
    const [responsaveis, aluno] = await Promise.all([
      prisma.responsavel.findMany({
        where: { email, ativo: true },
        select: { id: true, senhaPortal: true },
      }),
      prisma.aluno.findFirst({
        where: { email, ativo: true },
        select: { id: true, senhaPortal: true },
      }),
    ]);

    const responsaveisConfirmados = [] as number[];
    for (const responsavel of responsaveis) {
      if (responsavel.senhaPortal && await compare(senhaAtual, responsavel.senhaPortal)) {
        responsaveisConfirmados.push(responsavel.id);
      }
    }
    const alunoConfirmado = Boolean(
      aluno?.senhaPortal && await compare(senhaAtual, aluno.senhaPortal)
    );

    if (responsaveisConfirmados.length === 0 && !alunoConfirmado) {
      throw new AppError("A senha atual está incorreta.");
    }

    const senhaHash = await hash(novaSenha, 10);
    await prisma.$transaction([
      ...(responsaveisConfirmados.length > 0 ? [prisma.responsavel.updateMany({
        where: { id: { in: responsaveisConfirmados } },
        data: { senhaPortal: senhaHash },
      })] : []),
      ...(alunoConfirmado && aluno ? [prisma.aluno.update({
        where: { id: aluno.id },
        data: { senhaPortal: senhaHash },
      })] : []),
    ]);
  }
}
