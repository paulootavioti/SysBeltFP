import { prisma } from "../../../shared/database/prisma";
import { obterUnidadePublicaId } from "../../../shared/utils/unidadePublica";
import { assinarUrlFoto } from "../../uploads/services/assinarUrlFoto";

const FOTOS_POR_PAGINA = 8;

export class GetGaleriaPublicaService {
  async execute(pagina = 1) {
    const unidadeId = obterUnidadePublicaId();
    const skip = Math.max(0, pagina - 1) * FOTOS_POR_PAGINA;

    const fotos = await prisma.fotoTreino.findMany({
      where: { visivelNaLanding: true, aula: { unidadeId } },
      select: { id: true, url: true, legenda: true },
      orderBy: { publicadaEm: "desc" },
      skip,
      take: FOTOS_POR_PAGINA,
    });

    // a landing é pública e exibe com <img> — sem a url assinada, a leitura
    // da imagem cairia no 401 da rota de uploads.
    return fotos.map((foto) => ({ ...foto, url: assinarUrlFoto(foto.url) }));
  }
}
