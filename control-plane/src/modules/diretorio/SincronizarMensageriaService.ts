import type { PrismaClient, TipoCanalMensageria } from "@prisma/client";

export class SincronizarMensageriaService {
  constructor(private readonly db: PrismaClient) {}

  async execute(dados: { tenantKey: string; tipo: TipoCanalMensageria; identificadorExterno: string; appSecretRef: string; ativo: boolean }) {
    const ambiente = await this.db.ambienteTenant.findUnique({ where: { tenantKey: dados.tenantKey }, select: { assinanteId: true } });
    if (!ambiente) throw new Error("TENANT_NAO_ENCONTRADO");
    const existente = await this.db.contaMensageriaDiretorio.findUnique({
      where: { tipo_identificadorExterno: { tipo: dados.tipo, identificadorExterno: dados.identificadorExterno } },
      select: { id: true, assinanteId: true },
    });
    if (existente && existente.assinanteId !== ambiente.assinanteId) throw new Error("CONTA_MENSAGERIA_EM_USO");
    return this.db.contaMensageriaDiretorio.upsert({
      where: { tipo_identificadorExterno: { tipo: dados.tipo, identificadorExterno: dados.identificadorExterno } },
      create: { assinanteId: ambiente.assinanteId, tipo: dados.tipo, identificadorExterno: dados.identificadorExterno, appSecretRef: dados.appSecretRef, ativo: dados.ativo },
      update: { appSecretRef: dados.appSecretRef, ativo: dados.ativo },
      select: { id: true, atualizadoEm: true },
    });
  }
}
