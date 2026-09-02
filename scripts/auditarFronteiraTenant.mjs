import { pathToFileURL } from "node:url";
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

export function avaliarFronteiraTenant({ totalContas, contasSemUnidade, usuariosComVinculosMultiplasContas, concessoesDivergentes, superadminsAtivos }) {
  const bloqueios = [];
  if (totalContas < 1) bloqueios.push("NENHUMA_CONTA_CADASTRADA");
  if (contasSemUnidade > 0) bloqueios.push("CONTA_SEM_UNIDADE");
  if (usuariosComVinculosMultiplasContas > 0) bloqueios.push("USUARIO_ATRAVESSA_CONTAS");
  if (concessoesDivergentes > 0) bloqueios.push("CONCESSAO_DIVERGE_DA_CONTA");
  if (superadminsAtivos > 0) bloqueios.push("SUPERADMIN_ATIVO");
  return { isolamentoIntegro: bloqueios.length === 0, totalContas, contasSemUnidade, usuariosComVinculosMultiplasContas, concessoesDivergentes, superadminsAtivos, bloqueios };
}

export async function auditarFronteiraTenant(prisma) {
  const [contas, vinculos, concessoes, superadminsAtivos] = await Promise.all([
    prisma.conta.findMany({ select: { _count: { select: { unidades: true } } } }),
    prisma.usuarioUnidade.findMany({ select: { usuarioId: true, unidade: { select: { contaId: true } } } }),
    prisma.concessaoPlataforma.findMany({ select: { tenantKey: true, conta: { select: { tenantKey: true } } } }),
    prisma.usuario.count({ where: { perfil: "SUPERADMIN", ativo: true } }),
  ]);
  const contasPorUsuario = new Map();
  for (const vinculo of vinculos) {
    const ids = contasPorUsuario.get(vinculo.usuarioId) ?? new Set();
    ids.add(vinculo.unidade.contaId);
    contasPorUsuario.set(vinculo.usuarioId, ids);
  }
  return avaliarFronteiraTenant({
    totalContas: contas.length,
    contasSemUnidade: contas.filter((conta) => conta._count.unidades === 0).length,
    usuariosComVinculosMultiplasContas: [...contasPorUsuario.values()].filter((ids) => ids.size > 1).length,
    concessoesDivergentes: concessoes.filter((item) => item.tenantKey !== item.conta.tenantKey).length,
    superadminsAtivos,
  });
}

async function executar() {
  const prisma = new PrismaClient();
  try {
    const resultado = await auditarFronteiraTenant(prisma);
    console.log(JSON.stringify(resultado, null, 2));
    if (!resultado.isolamentoIntegro) process.exitCode = 1;
  } catch {
    console.error("Não foi possível auditar o isolamento multitenant.");
    process.exitCode = 2;
  } finally { await prisma.$disconnect(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await executar();
