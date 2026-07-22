import { AppError } from "../../../shared/errors/AppError";
import { getFotosStore } from "./blobStore";

export class GetFotoService {
  async execute(chave: string) {
    const store = getFotosStore();

    const resultado = await store.getWithMetadata(chave, { type: "arrayBuffer" });

    if (!resultado) {
      throw new AppError("Imagem não encontrada.", 404);
    }

    const contentType =
      (resultado.metadata.contentType as string | undefined) ?? "application/octet-stream";

    return {
      buffer: Buffer.from(resultado.data),
      contentType,
    };
  }
}
