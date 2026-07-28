import { prisma } from "../../../shared/database/prisma";
import { hash } from "bcryptjs";
import { AppError } from "../../../shared/errors/AppError";

interface CreateUsuarioDTO {
  nome: string;
  apelido?: string;
  email: string;
  senha: string;
  perfil: string;
  unidadeId: number | null;
  // todas as unidades que o usuário pode acessar — só é maior que 1 item
  // quando um SUPERADMIN vincula um ADMIN/RECEPCAO a mais de uma unidade.
  unidadeIds?: number[];
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
    unidadeId,
    unidadeIds,
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

    const idsVinculo = unidadeIds?.length ? unidadeIds : unidadeId ? [unidadeId] : [];

    return prisma.usuario.create({
      data: {
        nome,
        apelido,
        email,
        senha: senhaHash,
        perfil,
        unidadeId,
        nivelGraduacao,
        outrasGraduacoes,
        fotoUrl,
        unidadesVinculadas: idsVinculo.length
          ? { create: idsVinculo.map((id) => ({ unidadeId: id })) }
          : undefined,
      }
    });

  }

}