import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { gerarTokenRedefinicaoSenha } from "../../../shared/security/tokenRedefinicaoSenha";
import { obterEmailService, type EmailService } from "../../../shared/services/EmailService";

const UMA_HORA_MS = 60 * 60 * 1000;

export class SolicitarRedefinicaoSenhaService {
  constructor(private readonly emailService: EmailService = obterEmailService()) {}

  async execute(emailRecebido: string, origem: "EQUIPE" | "PROFESSOR") {
    const prisma = prismaDaRequisicao();
    const email = emailRecebido.trim().toLowerCase();
    const usuario = await prisma.usuario.findFirst({
      where: { email: { equals: email, mode: "insensitive" }, ativo: true },
      select: { id: true, email: true },
    });

    if (!usuario) return;

    const { token, tokenHash } = gerarTokenRedefinicaoSenha();
    await prisma.$transaction([
      prisma.tokenRedefinicaoSenha.updateMany({
        where: { email, tipo: "EQUIPE", usadoEm: null },
        data: { usadoEm: new Date() },
      }),
      prisma.tokenRedefinicaoSenha.create({
        data: {
          tokenHash,
          tipo: "EQUIPE",
          email,
          alvos: { usuarioIds: [usuario.id] },
          expiraEm: new Date(Date.now() + UMA_HORA_MS),
        },
      }),
    ]);

    const base = origem === "PROFESSOR"
      ? (process.env.PORTAL_PROFESSOR_URL ?? "http://localhost:5176")
      : (process.env.APP_WEB_URL ?? "http://localhost:5173");
    const link = `${base.replace(/\/$/, "")}/redefinir-senha?token=${encodeURIComponent(token)}`;

    await this.emailService.enviar(
      usuario.email,
      "Redefinição de senha do SysBelt",
      `Recebemos uma solicitação para redefinir sua senha. Acesse o link abaixo em até 1 hora:\n\n${link}\n\nSe não foi você, ignore esta mensagem.`,
    );
  }
}
