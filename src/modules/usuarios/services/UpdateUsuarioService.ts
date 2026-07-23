import { hash } from "bcryptjs";

import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";

interface UpdateUsuarioDTO {
  nome: string;
  apelido?: string | null;
  email: string;
  senha?: string | null;
  perfil: string;
  nivelGraduacao?: string | null;
  outrasGraduacoes?: string | null;
  fotoUrl?: string | null;
}

export class UpdateUsuarioService {

  async execute(id: number, data: UpdateUsuarioDTO) {

    const usuario = await prisma.usuario.findUnique({ where: { id } });

    if (!usuario) {
      throw new AppError("Usuário não encontrado.", 404);
    }

    if (data.email !== usuario.email) {
      const emailEmUso = await prisma.usuario.findUnique({ where: { email: data.email } });

      if (emailEmUso) {
        throw new AppError("E-mail já cadastrado.");
      }
    }

    const senhaHash = data.senha ? await hash(data.senha, 8) : undefined;

    return prisma.usuario.update({
      where: { id },
      data: {
        nome: data.nome,
        apelido: data.apelido,
        email: data.email,
        ...(senhaHash ? { senha: senhaHash } : {}),
        perfil: data.perfil,
        nivelGraduacao: data.nivelGraduacao,
        outrasGraduacoes: data.outrasGraduacoes,
        fotoUrl: data.fotoUrl,
      },
    });

  }

}
