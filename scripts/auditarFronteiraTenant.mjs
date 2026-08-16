import { pathToFileURL } from "node:url";
import { PrismaClient } from "@prisma/client";

export function avaliarFronteiraTenant({ totalContas, unidadesPorConta, superadminsAtivos }) {
  const bloqueios = [];
  if (totalContas !== 1) bloqueios.push("TOTAL_CONTAS_DIFERENTE_DE_UM");
  if (unidadesPorConta.length !== 1 || (unidadesPorConta[0]?.totalUnidades ?? 0) < 1) {
    bloqueios.push("UNIDADES_FORA_DE_UMA_UNICA_CONTA");
  }
  if (superadminsAtivos > 0) bloqueios.push("SUPERADMIN_ATIVO_NO_TENANT");

  return {
    prontaParaRemoverConta: bloqueios.length === 0,
    totalContas,
    totalUnidades: unidadesPorConta.reduce((total, grupo) => total + grupo.totalUnidades, 0),
    contasComUnidades: unidadesPorConta.length,
    superadminsAtivos,
    bloqueios,
  };
}

export async function auditarFronteiraTenant(prisma) {
  const [totalContas, grupos, superadminsAtivos] = await Promise.all([
    prisma.conta.count(),
    prisma.unidade.groupBy({ by: ["contaId"], _count: { _all: true } }),
    prisma.usuario.count({ where: { perfil: "SUPERADMIN", ativo: true } }),
  ]);

  return avaliarFronteiraTenant({
    totalContas,
    unidadesPorConta: grupos.map((grupo) => ({ totalUnidades: grupo._count._all })),
    superadminsAtivos,
  });
}

async function executar() {
  const prisma = new PrismaClient();
  try {
    const resultado = await auditarFronteiraTenant(prisma);
    console.log(JSON.stringify(resultado, null, 2));
    if (!resultado.prontaParaRemoverConta) process.exitCode = 1;
  } catch {
    console.error("Não foi possível auditar a fronteira do Tenant Plane.");
    process.exitCode = 2;
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await executar();
}
