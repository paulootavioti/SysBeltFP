import { prisma } from "../../../shared/database/prisma";
import { hash } from "bcryptjs";
import { AppError } from "../../../shared/errors/AppError";

interface CreateUsuarioDTO {
  nome: string;
  apelido?: string;
  email: string;
  senha: string;
  perfil: string;
  nivelGraduacao?: string;
  outrasGraduacoes?: string;
  fotoUrl?: string | null;
}

export class CreateUsuarioService {

  async execute({
    nome,
    apelido,
    email,
    senha,
    perfil,
    nivelGraduacao,
    outrasGraduacoes,
    fotoUrl
  }: CreateUsuarioDTO) {

    const usuarioExistente =
      await prisma.usuario.findUnique({
        where: {
          email
        }
      });

    if (usuarioExistente) {
      throw new AppError(
        "E-mail já cadastrado."
      );
    }

    const senhaHash =
      await hash(senha, 8);

    return prisma.usuario.create({
      data: {
        nome,
        apelido,
        email,
        senha: senhaHash,
        perfil,
        nivelGraduacao,
        outrasGraduacoes,
        fotoUrl
      }
    });

  }

}