import { prisma } from "../database/prisma";

// Toda Unidade pertence a uma Conta (o assinante). Nos testes, o que está
// sendo exercitado quase sempre é a regra de negócio dentro da academia,
// não a fronteira entre assinantes — então todas as unidades de teste
// entram numa conta única e estável, criada na primeira vez que alguém
// precisa dela.
//
// Isso mantém a semântica que os testes já assumiam: duas unidades criadas
// no mesmo teste são duas FILIAIS da mesma academia, que é exatamente o
// caso que `escopoUnidade` sempre tratou. Teste que precise de contas
// DIFERENTES (isolamento entre assinantes) deve criar a conta
// explicitamente, para deixar essa intenção visível.
const NOME_CONTA_PADRAO = "TESTE_CONTA_PADRAO";

export async function contaDeTeste(): Promise<number> {
  const existente = await prisma.conta.findFirst({ where: { nome: NOME_CONTA_PADRAO } });

  if (existente) return existente.id;

  const criada = await prisma.conta.create({ data: { nome: NOME_CONTA_PADRAO } });

  return criada.id;
}

/** Substitui `prisma.unidade.create({ data: { nome } })` nos testes. */
export async function criarUnidadeDeTeste(nome: string) {
  return prisma.unidade.create({ data: { nome, contaId: await contaDeTeste() } });
}
