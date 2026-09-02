import type { Usuario } from "../../../contexts/authContextData";
import { api } from "../../../services/api";

export interface MensagemSuporte {
  usuarioId: number;
  usuarioNome: string;
  usuarioEmail: string;
  mensagem: string;
  data: string;
}

export class SuporteService {
  static async enviar(usuario: Usuario, mensagem: string): Promise<MensagemSuporte> {
    const registro: MensagemSuporte = {
      usuarioId: usuario.id,
      usuarioNome: usuario.nome,
      usuarioEmail: usuario.email,
      mensagem,
      data: new Date().toISOString(),
    };

    await api.post("/suporte", {
      mensagem,
      contexto: {
        rota: `${window.location.pathname}${window.location.search}`,
        navegador: navigator.userAgent,
      },
    });

    return registro;
  }
}
