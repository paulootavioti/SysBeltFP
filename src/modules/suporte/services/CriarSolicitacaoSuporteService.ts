import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { obterEmailService, type EmailService } from "../../../shared/services/EmailService";

interface Entrada {
  usuario: { id: number; nome: string; email: string; unidadeId: number | null };
  mensagem: string;
  contexto?: { rota?: string; navegador?: string };
}

export class CriarSolicitacaoSuporteService {
  constructor(private readonly emailService: EmailService = obterEmailService()) {}

  async execute(entrada: Entrada) {
    const solicitacao = await prismaDaRequisicao().solicitacaoSuporte.create({
      data: {
        usuarioId: entrada.usuario.id,
        usuarioNome: entrada.usuario.nome,
        usuarioEmail: entrada.usuario.email,
        unidadeId: entrada.usuario.unidadeId,
        mensagem: entrada.mensagem,
        contexto: entrada.contexto,
      },
    });

    const destinatario = process.env.SUPPORT_EMAIL;
    if (destinatario) {
      try {
        await this.emailService.enviar(
          destinatario,
          `[SysBelt] Chamado #${solicitacao.id} — ${entrada.usuario.nome}`,
          `Usuário: ${entrada.usuario.nome} <${entrada.usuario.email}>\nUnidade: ${entrada.usuario.unidadeId ?? "todas"}\nRota: ${entrada.contexto?.rota ?? "não informada"}\n\n${entrada.mensagem}`,
        );
      } catch (erro) {
        console.error("Falha ao notificar chamado de suporte", { solicitacaoId: solicitacao.id, erro: String(erro) });
      }
    }

    return solicitacao;
  }
}
