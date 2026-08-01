import type { Usuario } from "../../../contexts/authContextData";

export interface MensagemSuporte {
  usuarioId: number;
  usuarioNome: string;
  usuarioEmail: string;
  mensagem: string;
  data: string;
}

const CHAVE_STORAGE = "@sgcl:ajudaMensagensSuporte";

// TODO(produto/infra): definir o destino real da mensagem de suporte
// (e-mail da equipe, abertura de ticket num helpdesk, etc.) e trocar esta
// implementação por uma chamada de API de verdade. Por enquanto a
// mensagem só fica registrada no console e no localStorage do navegador
// (nada chega à equipe de suporte).
export class SuporteService {
  static async enviar(usuario: Usuario, mensagem: string): Promise<MensagemSuporte> {
    const registro: MensagemSuporte = {
      usuarioId: usuario.id,
      usuarioNome: usuario.nome,
      usuarioEmail: usuario.email,
      mensagem,
      data: new Date().toISOString(),
    };

    console.info("[SuporteService] TODO: enviar ao canal de suporte real.", registro);

    try {
      const anteriores: MensagemSuporte[] = JSON.parse(localStorage.getItem(CHAVE_STORAGE) ?? "[]");
      localStorage.setItem(CHAVE_STORAGE, JSON.stringify([...anteriores, registro]));
    } catch {
      // localStorage indisponível (modo privado, quota cheia etc.) — a
      // mensagem já foi pro console, não é crítico perder o histórico local.
    }

    return registro;
  }
}
