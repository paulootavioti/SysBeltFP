import { hash } from "bcryptjs";

import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

interface SetSenhaPortalDTO {
  id: number;
  senha: string;
}

// login direto do aluno no Portal da Família (perfil ALUNO) — mesma ideia
// de SetSenhaPortalResponsavelService, aplicada ao próprio aluno.
export class SetSenhaPortalAlunoService {
  async execute({ id, senha }: SetSenhaPortalDTO, unidadeId: number | null) {
    const aluno = await prisma.aluno.findUnique({ where: { id } });

    if (!aluno) {
      throw new AppError("Aluno não encontrado.");
    }

    garantirAcessoUnidade(unidadeId, aluno.unidadeId, "Aluno não encontrado.");

    if (!aluno.email) {
      throw new AppError("Cadastre um e-mail para o aluno antes de definir a senha do portal.");
    }

    const senhaPortal = await hash(senha, 8);

    await prisma.aluno.update({
      where: { id },
      data: { senhaPortal },
    });

    return { ok: true };
  }
}
