import { hash } from "bcryptjs";

import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

interface SetSenhaPortalDTO {
  id: number;
  senha: string;
}

// senha inicial (ou redefinição) de acesso ao Portal da Família — exige
// que o responsável já tenha e-mail cadastrado, senão não há como logar.
export class SetSenhaPortalResponsavelService {
  async execute({ id, senha }: SetSenhaPortalDTO, unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    const responsavel = await prisma.responsavel.findUnique({ where: { id } });

    if (!responsavel) {
      throw new AppError("Responsável não encontrado.");
    }

    garantirAcessoUnidade(unidadeId, responsavel.unidadeId, "Responsável não encontrado.");

    if (!responsavel.email) {
      throw new AppError("Cadastre um e-mail para o responsável antes de definir a senha do portal.");
    }

    const senhaPortal = await hash(senha, 8);

    await prisma.responsavel.update({
      where: { id },
      data: { senhaPortal },
    });

    return { ok: true };
  }
}
