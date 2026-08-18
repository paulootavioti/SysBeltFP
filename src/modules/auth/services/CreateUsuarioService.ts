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
  // todas as unidades da academia em que o usuário pode atuar.
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

    // Sem nenhuma unidade não há conta a que atribuir o usuário, e o escopo
    // de conta não tem por onde alcançá-lo: ele entra no banco enxergando
    // nada, sem que a tela diga por quê. Recusar aqui, e não só no
    // controller, vale para todo caminho de criação — script, seed, import.
    if (contaId === null) {
      throw new AppError("Informe pelo menos uma unidade para este usuário.");
    }

    // Só o DONO pode ficar sem unidade ATIVA (RN-164): é assim que ele
    // alcança as filiais todas. Qualquer outro perfil trabalha numa unidade,
    // e sem ela não teria escopo nenhum.
    if (unidadeId === null && perfil !== "DONO") {
      throw new AppError("Só o perfil Dono pode ficar sem unidade ativa.");
    }

    // O DONO alcança a academia inteira: recebe vínculo com todas as
    // filiais da conta, não só com as que vieram no formulário.
    const idsVinculo = perfil === "DONO" ? await unidadesDaConta(contaId) : idsPedidos;

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
