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
const NOME_PLANO_PADRAO = "TESTE_PLANO_PADRAO";

// A conta de teste assina um plano com TODOS os recursos. Sem isso, cada
// teste de módulo que passa por uma trava de plano (WhatsApp, por exemplo)
// falharia por um motivo que não é o que ele está verificando. Quem quer
// testar a trava em si cria uma conta sem o recurso, de propósito.
const RECURSOS_DE_TESTE = ["WHATSAPP", "GATEWAY_AUTOMATICO", "CONTROLE_ACESSO"];

async function garantirConcessaoDeTeste() {
  await prisma.concessaoPlataforma.upsert({
    where: { id: 1 },
    update: { statusAcesso: "ATIVO", recursos: RECURSOS_DE_TESTE, expiraEm: new Date("2100-01-01T00:00:00.000Z") },
    create: {
      id: 1,
      tenantKey: "00000000-0000-4000-8000-000000000001",
      statusAcesso: "ATIVO",
      recursos: RECURSOS_DE_TESTE,
      versaoContrato: 1,
      revisao: 1,
      emitidaEm: new Date("2026-08-12T00:00:00.000Z"),
      expiraEm: new Date("2100-01-01T00:00:00.000Z"),
      payloadHash: "concessao-ficticia-exclusiva-dos-testes",
      assinaturaBase64: "assinatura-ficticia-exclusiva-dos-testes",
    },
  });
}

export async function contaDeTeste(): Promise<number> {
  await garantirConcessaoDeTeste();
  const plano = await prisma.planoPlataforma.upsert({
    where: { nome: NOME_PLANO_PADRAO },
    update: { recursos: RECURSOS_DE_TESTE },
    create: {
      nome: NOME_PLANO_PADRAO,
      alunosPorBloco: 10,
      precoPorBlocoCentavos: 3700,
      recursos: RECURSOS_DE_TESTE,
    },
  });

  const existente = await prisma.conta.findFirst({
    where: { nome: NOME_CONTA_PADRAO },
    include: { assinatura: true },
  });

  if (existente) {
    // A conta pode ter sobrado de um banco criado antes de a assinatura
    // existir. Sem ela, toda trava de plano bloquearia — e o teste
    // falharia por um motivo que não é o que ele verifica.
    if (!existente.assinatura) {
      await prisma.assinaturaPlataforma.create({
        data: { contaId: existente.id, planoId: plano.id, status: "ATIVA" },
      });
    }

    return existente.id;
  }

  const criada = await prisma.conta.create({
    data: {
      nome: NOME_CONTA_PADRAO,
      assinatura: { create: { planoId: plano.id, status: "ATIVA" } },
    },
  });

  return criada.id;
}

/** Substitui `prisma.unidade.create({ data: { nome } })` nos testes. */
export async function criarUnidadeDeTeste(nome: string) {
  return prisma.unidade.create({ data: { nome, contaId: await contaDeTeste() } });
}

/**
 * Unidade de um assinante SEM os recursos pagos — pra testar a trava de
 * plano, e não o caminho feliz.
 */
export async function criarUnidadeSemRecursos(nome: string, nomeDaConta = `${nome}_CONTA`) {
  const plano = await prisma.planoPlataforma.upsert({
    where: { nome: `${nomeDaConta}_PLANO` },
    update: { recursos: [] },
    create: {
      nome: `${nomeDaConta}_PLANO`,
      alunosPorBloco: 10,
      precoPorBlocoCentavos: 3700,
      recursos: [],
    },
  });

  const conta = await prisma.conta.create({
    data: {
      nome: nomeDaConta,
      assinatura: { create: { planoId: plano.id, status: "ATIVA" } },
    },
  });

  return prisma.unidade.create({ data: { nome, contaId: conta.id } });
}
