import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { AuditLogService } from "../../../shared/services/AuditLogService";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import { AutentiqueProvider } from "../../assinaturaEletronica/providers/AutentiqueProvider";

const auditLog = new AuditLogService();

export class EnviarContratoAssinaturaEletronicaService {
  async execute(id: number, unidadeId: number | null, usuarioId: number) {
    const prisma = prismaDaRequisicao();
    const contrato = await prisma.contrato.findUnique({
      where: { id },
      include: {
        aluno: { select: { nome: true, email: true, cpf: true } },
        contratanteResponsavel: { select: { nome: true, email: true, cpf: true } },
      },
    });
    if (!contrato) throw new AppError("Contrato não encontrado.", 404);
    garantirAcessoUnidade(unidadeId, contrato.unidadeId, "Contrato não encontrado.");
    if (!["RASCUNHO", "PENDENTE_ASSINATURA"].includes(contrato.situacao)) {
      throw new AppError("Este contrato não pode mais ser enviado para assinatura.");
    }

    const pendente = await prisma.solicitacaoAssinatura.findFirst({
      where: { contratoId: id, status: { in: ["ENVIANDO", "PENDENTE"] } },
      orderBy: { createdAt: "desc" },
    });
    if (pendente) return pendente;

    const solicitacao = await prisma.solicitacaoAssinatura.create({
      data: { unidadeId: contrato.unidadeId, contratoId: id, provedor: "AUTENTIQUE" },
    });
    const contratante = contrato.contratanteResponsavel ?? contrato.aluno;

    try {
      const resultado = await new AutentiqueProvider().enviarParaAssinatura({
        conteudo: contrato.conteudoGerado,
        referenciaExterna: String(contrato.id),
        signatarios: [{ nome: contratante.nome, email: contratante.email, cpf: contratante.cpf }],
      });
      const atualizada = await prisma.solicitacaoAssinatura.update({
        where: { id: solicitacao.id },
        data: {
          provedorDocumentoId: resultado.provedorDocumentoId,
          linkAssinatura: resultado.linkAssinatura,
          status: resultado.status,
          enviadoEm: new Date(),
        },
      });
      if (contrato.situacao === "RASCUNHO") {
        await prisma.contrato.update({ where: { id }, data: { situacao: "PENDENTE_ASSINATURA" } });
      }
      await auditLog.registrar({
        unidadeId: contrato.unidadeId,
        usuarioId,
        entidade: "Contrato",
        entidadeId: id,
        operacao: "ATUALIZACAO",
        valoresAntes: { situacao: contrato.situacao },
        valoresDepois: { situacao: "PENDENTE_ASSINATURA", provedor: "AUTENTIQUE", solicitacaoId: atualizada.id },
      });
      return atualizada;
    } catch (erro) {
      await prisma.solicitacaoAssinatura.update({
        where: { id: solicitacao.id },
        data: { status: "FALHA", erro: erro instanceof Error ? erro.message.slice(0, 1000) : "Falha desconhecida." },
      });
      throw erro;
    }
  }
}
