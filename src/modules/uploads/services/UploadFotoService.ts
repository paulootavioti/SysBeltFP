import { randomUUID } from "crypto";

import { AppError } from "../../../shared/errors/AppError";
import { getFotosStore } from "./blobStore";

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const EXTENSAO_POR_TIPO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

interface UploadFotoDTO {
  buffer: Buffer;
  mimetype: string;
  prefixo: "alunos" | "responsaveis" | "usuarios";
}

export class UploadFotoService {
  async execute({ buffer, mimetype, prefixo }: UploadFotoDTO) {
    if (!TIPOS_PERMITIDOS.includes(mimetype)) {
      throw new AppError(
        "Formato de imagem não suportado. Envie JPEG, PNG, WEBP ou GIF."
      );
    }

    const extensao = EXTENSAO_POR_TIPO[mimetype];
    const chave = `${prefixo}/${randomUUID()}.${extensao}`;

    const store = getFotosStore();

    await store.set(chave, new Blob([Uint8Array.from(buffer)], { type: mimetype }), {
      metadata: { contentType: mimetype },
    });

    return { url: `/uploads/${chave}` };
  }
}
