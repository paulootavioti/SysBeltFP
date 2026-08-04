import { UploadFotoService } from "../../uploads/services/UploadFotoService";
import { PublicarFotosTreinoService } from "../../fotosTreino/services/PublicarFotosTreinoService";

interface Solicitante {
  id: number;
  perfil: string;
  unidadeId: number | null;
}

interface PublicarFotoAulaProfessorDTO {
  aulaId: number;
  buffer: Buffer;
  mimetype: string;
  legenda: string;
  visivelNaLanding: boolean;
}

export class PublicarFotoAulaProfessorService {
  async execute(data: PublicarFotoAulaProfessorDTO, solicitante: Solicitante) {
    // upload (Netlify Blobs, mesmo prefixo "treinos" já usado pela chamada
    // do sgcl-web) seguido da publicação — reaproveita PublicarFotosTreinoService
    // pra não duplicar a checagem de turma própria e de autorização de imagem.
    const { url } = await new UploadFotoService().execute({
      buffer: data.buffer,
      mimetype: data.mimetype,
      prefixo: "treinos",
    });

    const resultado = await new PublicarFotosTreinoService().execute(
      { aulaId: data.aulaId, urls: [url], legenda: data.legenda, visivelNaLanding: data.visivelNaLanding },
      solicitante
    );

    return { foto: resultado.fotos[0], familiasPresentes: resultado.familiasPresentes };
  }
}
