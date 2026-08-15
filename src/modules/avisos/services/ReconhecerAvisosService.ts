import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";

interface AvisoParaReconhecer {
  tipo: string;
  referenciaId: number;
}

export class ReconhecerAvisosService {
  async execute(usuarioId: number, avisos: AvisoParaReconhecer[]) {
    const prisma = prismaDaRequisicao();
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
