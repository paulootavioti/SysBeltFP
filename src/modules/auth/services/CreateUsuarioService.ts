import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { hash } from "bcryptjs";
import { AppError } from "../../../shared/errors/AppError";
import {
  garantirUnidadesDaMesmaConta,
  unidadesDaConta,
} from "../../../shared/utils/contaDoUsuario";

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
    const prisma = prismaDaRequisicao();

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

    const idsPedidos = unidadeIds?.length ? unidadeIds : unidadeId ? [unidadeId] : [];

    // Vínculo é a fronteira entre assinantes: se um usuário puder acessar
    // unidades de contas diferentes, ele atravessa a fronteira trocando a
    // unidade ativa. Recusa a lista misturada em vez de gravar.
    const contaId = await garantirUnidadesDaMesmaConta(idsPedidos);

    // O DONO alcança a academia inteira: recebe vínculo com todas as
    // filiais da conta, não só com as que vieram no formulário.
    const idsVinculo =
      perfil === "DONO" && contaId !== null ? await unidadesDaConta(contaId) : idsPedidos;

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
