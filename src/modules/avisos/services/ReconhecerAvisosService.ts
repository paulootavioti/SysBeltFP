import { prisma } from "../../../shared/database/prisma";

interface AvisoParaReconhecer {
  tipo: string;
  referenciaId: number;
}

export class ReconhecerAvisosService {
  async execute(usuarioId: number, avisos: AvisoParaReconhecer[]) {
    await prisma.avisoReconhecido.createMany({
      data: avisos.map((aviso) => ({
        usuarioId,
        tipo: aviso.tipo,
        referenciaId: aviso.referenciaId,
      })),
      skipDuplicates: true,
    });
  }
}
