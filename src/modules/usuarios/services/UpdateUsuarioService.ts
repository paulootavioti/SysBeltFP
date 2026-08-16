import { hash } from "bcryptjs";

import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import {
  garantirUnidadesDaMesmaConta,
  unidadesDaConta,
} from "../../../shared/utils/contaDoUsuario";

interface UpdateUsuarioDTO {
  nome: string;
  apelido?: string | null;
  email: string;
  senha?: string | null;
  perfil: string;
  nivelGraduacao?: string | null;
  outrasGraduacoes?: string | null;
  fotoUrl?: string | null;
  // só é aplicado quando quem edita é SUPERADMIN (checado no controller) —
  // substitui por completo a lista de unidades vinculadas ao usuário.
  unidadeIds?: number[];
}

export class UpdateUsuarioService {

  async execute(id: number, data: UpdateUsuarioDTO, unidadeId: number | null) {
    const prisma = prismaDaRequisicao();

    const usuario = await prisma.usuario.findUnique({ where: { id } });

    if (!usuario) {
      throw new AppError("Usuário não encontrado.", 404);
    }

    garantirAcessoUnidade(unidadeId, usuario.unidadeId, "Usuário não encontrado.");

    if (data.email !== usuario.email) {
      const emailEmUso = await prisma.usuario.findUnique({ where: { email: data.email } });

      if (emailEmUso) {
        throw new AppError("E-mail já cadastrado.");
      }
    }

    const senhaHash = data.senha ? await hash(data.senha, 8) : undefined;

    // virou SUPERADMIN: não pertence a nenhuma unidade — some com a ativa
    // e com todos os vínculos, ainda que unidadeIds tenha vindo preenchido.
    if (data.perfil === "SUPERADMIN") {
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
          unidadeId: null,
          unidadesVinculadas: { deleteMany: {} },
        },
      });
    }

    // Mesma fronteira do cadastro: vínculo não atravessa conta, e o DONO
    // alcança todas as filiais da própria academia.
    const contaId = await garantirUnidadesDaMesmaConta(data.unidadeIds ?? []);

    const idsVinculo =
      data.perfil === "DONO" && contaId !== null
        ? await unidadesDaConta(contaId)
        : (data.unidadeIds ?? []);

    // a unidade ATIVA só muda se ela não estiver mais entre as vinculadas
    // (ex.: SUPERADMIN removeu a unidade que o usuário estava usando) —
    // do contrário mantém, pra não derrubar a sessão ativa dele à toa.
    const novaUnidadeAtiva =
      idsVinculo.length && !idsVinculo.includes(usuario.unidadeId ?? -1)
        ? idsVinculo[0]
        : undefined;

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
        ...(novaUnidadeAtiva ? { unidadeId: novaUnidadeAtiva } : {}),
        ...(idsVinculo.length
          ? {
              unidadesVinculadas: {
                deleteMany: {},
                create: idsVinculo.map((unidadeId) => ({ unidadeId })),
              },
            }
          : {}),
      },
    });

  }

}
