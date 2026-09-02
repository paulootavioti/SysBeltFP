import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { gerarTokenRedefinicaoSenha } from "../../../shared/security/tokenRedefinicaoSenha";
import { obterEmailService, type EmailService } from "../../../shared/services/EmailService";

const UMA_HORA_MS = 60 * 60 * 1000;

export class SolicitarRedefinicaoSenhaFamiliaService {
  constructor(private readonly emailService: EmailService = obterEmailService()) {}

  async execute(emailRecebido: string) {
    const prisma = prismaDaRequisicao();
    const email = emailRecebido.trim().toLowerCase();
    const [responsaveis, alunos] = await Promise.all([
      prisma.responsavel.findMany({ where: { email: { equals: email, mode: "insensitive" }, ativo: true }, select: { id: true, email: true } }),
      prisma.aluno.findMany({ where: { email: { equals: email, mode: "insensitive" }, ativo: true }, select: { id: true, email: true } }),
    ]);

    if (!responsaveis.length && !alunos.length) return;

    const { token, tokenHash } = gerarTokenRedefinicaoSenha();
    await prisma.$transaction([
      prisma.tokenRedefinicaoSenha.updateMany({ where: { email, tipo: "FAMILIA", usadoEm: null }, data: { usadoEm: new Date() } }),
      prisma.tokenRedefinicaoSenha.create({
        data: {
          tokenHash,
          tipo: "FAMILIA",
          email,
          alvos: { responsavelIds: responsaveis.map((item) => item.id), alunoIds: alunos.map((item) => item.id) },
          expiraEm: new Date(Date.now() + UMA_HORA_MS),
        },
      }),
    ]);

    const base = process.env.PORTAL_FAMILIA_URL ?? "http://localhost:5175";
    const link = `${base.replace(/\/$/, "")}/redefinir-senha?token=${encodeURIComponent(token)}`;
    const destinatario = responsaveis[0]?.email ?? alunos[0]?.email;
    if (!destinatario) return;

    await this.emailService.enviar(
      destinatario,
      "Redefinição de senha do Portal da Família",
      `Recebemos uma solicitação para redefinir sua senha. Acesse o link abaixo em até 1 hora:\n\n${link}\n\nSe não foi você, ignore esta mensagem.`,
    );
  }
}
