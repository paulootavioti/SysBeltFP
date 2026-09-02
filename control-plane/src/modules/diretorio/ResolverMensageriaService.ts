import type { PrismaClient, TipoCanalMensageria } from "@prisma/client";

export class ResolverMensageriaService {
  constructor(private readonly db: PrismaClient) {}

  async execute(tipo: TipoCanalMensageria, identificadorExterno: string) {
    const conta = await this.db.contaMensageriaDiretorio.findFirst({
      where: {
        tipo,
        identificadorExterno,
        ativo: true,
        assinante: { ambiente: { status: { in: ["ATIVO", "SUSPENSO"] } } },
      },
      select: {
        appSecretRef: true,
        assinante: {
          select: {
            slug: true,
            ambiente: {
              select: {
                tenantKey: true,
                status: true,
              },
            },
          },
        },
      },
    });
    const ambiente = conta?.assinante.ambiente;
    if (!conta || !ambiente) {
      throw new Error("CONTA_MENSAGERIA_NAO_ENCONTRADA");
    }
    return {
      tenantKey: ambiente.tenantKey,
      slug: conta.assinante.slug,
      status: ambiente.status,
      appSecretRef: conta.appSecretRef,
    };
  }
}
