import { api } from "../../services/api";

export class UploadService {
  static async enviarFoto(file: File, prefixo: "alunos" | "responsaveis" | "usuarios") {
    const formData = new FormData();
    formData.append("arquivo", file);
    formData.append("prefixo", prefixo);

    const response = await api.post<{ url: string }>("/uploads", formData);

    return response.data;
  }

  static async buscarImagemBlob(caminho: string) {
    const response = await api.get(caminho, { responseType: "blob" });

    return response.data as Blob;
  }
}
