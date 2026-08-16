import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";

interface CreateUnidadeDTO {
  nome: string;
  contaId: number;
}

// Uma filial nova nasce sempre dentro de uma conta — é o que impede que
// unidades de assinantes diferentes acabem no mesmo balaio. Quem é ADMIN
// abre filial na própria conta (resolvida pela unidade ativa, no
// controller); o SUPERADMIN precisa dizer em qual conta.
export class CreateUnidadeService {
  async execute(data: CreateUnidadeDTO) {
    const prisma = prismaDaRequisicao();
    const conta = await prisma.conta.findUnique({ where: { id: data.contaId } });

    if (!conta) {
      throw new AppError("Conta não encontrada.", 404);
    }

    const unidade = await prisma.unidade.create({
      data: { nome: data.nome.trim(), contaId: data.contaId },
    });

    // O DONO alcança a academia inteira, inclusive o que for aberto
    // depois dele. Sem isto, abrir uma filial deixaria o dono sem acesso
    // à própria unidade nova até alguém lembrar de reeditar o cadastro
    // dele — e o sintoma ("não aparece no seletor") não aponta pra causa.
    const donos = await prisma.usuario.findMany({
      where: { perfil: "DONO", unidadesVinculadas: { some: { unidade: { contaId: data.contaId } } } },
      select: { id: true },
    });

    if (donos.length > 0) {
      await prisma.usuarioUnidade.createMany({
        data: donos.map((dono) => ({ usuarioId: dono.id, unidadeId: unidade.id })),
        skipDuplicates: true,
      });
    }

    return unidade;
  }
}
