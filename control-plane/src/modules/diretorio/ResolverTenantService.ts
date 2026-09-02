import type { PrismaClient } from "@prisma/client";

export class ResolverTenantService {
  constructor(private readonly db: PrismaClient) {}

  async execute(slug: string) {
    const ambiente = await this.db.ambienteTenant.findFirst({
      where: { assinante: { slug }, status: { in: ["ATIVO", "SUSPENSO"] } },
      select: {
        tenantKey: true,
        status: true,
        assinante: { select: { slug: true } },
      },
    });
    if (!ambiente) {
      throw new Error("TENANT_NAO_ENCONTRADO");
    }
    return {
      tenantKey: ambiente.tenantKey,
      slug: ambiente.assinante.slug,
      status: ambiente.status,
    };
  }
}
