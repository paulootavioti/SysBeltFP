import { prisma } from "../../../shared/database/prisma";

// Base de cobrança da plataforma: quantos alunos ATIVOS a conta tem,
// somando todas as suas unidades.
//
// Duas decisões embutidas aqui, ambas deliberadas:
//
// 1. Soma as filiais. Uma rede com três unidades de 30 alunos paga por 90
//    (9 faixas), não três vezes por 30 (3 × 3 faixas). É o que faz o preço
//    por faixa ser justo com quem cresce abrindo unidade.
//
// 2. Conta só `ativo = true`. Aluno que saiu da academia é desativado
//    (ToggleAlunoAtivoService), não apagado — a ficha, o histórico de
//    graduação e o financeiro dele continuam existindo. Se ex-aluno
//    contasse na fatura, o assinante teria incentivo pra APAGAR cadastro
//    todo mês pra baixar a conta, destruindo justamente o histórico que o
//    sistema existe pra guardar (e que a LGPD manda conservar enquanto
//    houver obrigação legal). Cobrar pelo ativo alinha as duas coisas.
export class ContarAlunosDaContaService {
  async execute(contaId: number): Promise<number> {
    return prisma.aluno.count({
      where: {
        ativo: true,
        unidade: { contaId },
      },
    });
  }
}
