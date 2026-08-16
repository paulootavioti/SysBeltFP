import { ApiClient } from "../../../shared/api/ApiClient";
import type { MinhaAssinatura } from "../types";

export class PlataformaService {
  static async minhaAssinatura() {
    return ApiClient.get<MinhaAssinatura>("/plataforma/minha-assinatura");
  }
}
