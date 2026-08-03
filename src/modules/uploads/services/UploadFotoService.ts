import { randomUUID } from "crypto";

import { AppError } from "../../../shared/errors/AppError";
import { getFotosStore } from "./blobStore";

const TIPOS_IMAGEM = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// comprovantes de pagamento (prefixo "financeiro") e contrato assinado
// (prefixo "contratos") também aceitam PDF — os demais prefixos
// continuam só imagem de perfil.
const TIPOS_PERMITIDOS_POR_PREFIXO: Record<string, string[]> = {
  alunos: TIPOS_IMAGEM,
  responsaveis: TIPOS_IMAGEM,
  usuarios: TIPOS_IMAGEM,
  financeiro: [...TIPOS_IMAGEM, "application/pdf"],
  contratos: [...TIPOS_IMAGEM, "application/pdf"],
  produtos: TIPOS_IMAGEM,
  treinos: TIPOS_IMAGEM,
};

const EXTENSAO_POR_TIPO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

interface UploadFotoDTO {
  buffer: Buffer;
  mimetype: string;
  prefixo: "alunos" | "responsaveis" | "usuarios" | "financeiro" | "contratos" | "produtos" | "treinos";
}

export class UploadFotoService {
  async execute({ buffer, mimetype, prefixo }: UploadFotoDTO) {
    const tiposPermitidos = TIPOS_PERMITIDOS_POR_PREFIXO[prefixo] ?? TIPOS_IMAGEM;

    if (!tiposPermitidos.includes(mimetype)) {
      throw new AppError(
        prefixo === "financeiro" || prefixo === "contratos"
          ? "Formato não suportado. Envie JPEG, PNG, WEBP, GIF ou PDF."
          : "Formato de imagem não suportado. Envie JPEG, PNG, WEBP ou GIF."
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
