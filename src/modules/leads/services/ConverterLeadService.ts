import { Prisma, type TipoConsentimento } from "@prisma/client";
import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import { obterContextoRequisicao } from "../../../shared/context/contextoRequisicao";

interface EntradaConversao { dataNascimento?: string; }

export class ConverterLeadService {
  async execute(id: number, unidadeId: number | null, usuarioId: number, entrada: EntradaConversao) {
    const db = prismaDaRequisicao();
    try {
      return await db.$transaction(async (tx) => {
        const lead = await tx.lead.findUnique({
          where: { id }, include: { consentimentos: { where: { revogadoEm: null } }, unidade: { select: { contaId: true } }, aluno: { include: { unidade: { select: { contaId: true } } } } },
        });
        if (!lead) throw new AppError("Lead não encontrado.", 404);
        garantirAcessoUnidade(unidadeId, lead.unidadeId, "Lead não encontrado.");
        if (lead.estagio === "PERDIDO") throw new AppError("Reabra o lead antes de converter.");
        if (lead.estagio === "MATRICULADO" && lead.alunoId) return { alunoId: lead.alunoId, reativado: false, jaConvertido: true };

        let alunoId: number;
        let reativado = false;
        if (lead.aluno) {
          if (lead.aluno.unidade.contaId !== lead.unidade.contaId) throw new AppError("Aluno vinculado não pertence à academia.");
          if (lead.aluno.ativo) throw new AppError("Este contato já possui aluno ativo.");
          await tx.aluno.update({ where: { id: lead.aluno.id }, data: { ativo: true } });
          await tx.alunoUnidade.upsert({
            where: { alunoId_unidadeId: { alunoId: lead.aluno.id, unidadeId: lead.unidadeId } }, update: {}, create: { alunoId: lead.aluno.id, unidadeId: lead.unidadeId },
          });
          alunoId = lead.aluno.id;
          reativado = true;
        } else {
          const nome = lead.tipoContato === "RESPONSAVEL" ? lead.praticanteNome : lead.nome;
          const nascimento = lead.praticanteNascimento ?? (entrada.dataNascimento ? new Date(`${entrada.dataNascimento}T00:00:00.000Z`) : null);
          if (!nome) throw new AppError("Informe o nome do praticante antes de converter.");
          if (!nascimento || Number.isNaN(nascimento.getTime()) || nascimento > new Date()) throw new AppError("Informe uma data de nascimento válida para o aluno.");
          const aluno = await tx.aluno.create({ data: {
            unidadeId: lead.unidadeId, nome, dataNascimento: nascimento,
            whatsapp: lead.telefoneE164, email: lead.tipoContato === "PRATICANTE" ? lead.email : null,
            faixa: "Branca", grau: 0, ativo: true,
            unidadesPermitidas: { create: { unidadeId: lead.unidadeId } },
          } });
          alunoId = aluno.id;
        }

        if (lead.consentimentos.length) await tx.consentimento.createMany({ data: lead.consentimentos.map((consentimento) => ({
          unidadeId: lead.unidadeId, alunoId,
          tipo: (consentimento.finalidade === "COMUNICACOES" ? "COMUNICACOES" : "TRATAMENTO_DADOS") as TipoConsentimento,
          concedido: true, versaoPolitica: consentimento.versao, textoAceito: consentimento.textoAceito,
          registradoPorId: usuarioId, ip: consentimento.ip, dispositivo: consentimento.userAgent,
          observacao: `Transferido do lead ${lead.id}.`, createdAt: consentimento.aceitoEm,
        })) });
        await tx.lead.update({ where: { id: lead.id }, data: { alunoId, estagio: "MATRICULADO", proximaAcaoEm: null } });
        await tx.conversaMensageria.updateMany({ where: { leadId: lead.id }, data: { alunoId } });
        await tx.leadEvento.create({ data: {
          leadId: lead.id, unidadeId: lead.unidadeId, usuarioId, tipo: reativado ? "ALUNO_REATIVADO" : "LEAD_CONVERTIDO",
          descricao: reativado ? "Ex-aluno reativado a partir da conversa." : "Lead convertido em aluno.", payload: { alunoId },
        } });
        const contexto = obterContextoRequisicao();
        await tx.auditLog.create({ data: {
          unidadeId: lead.unidadeId, usuarioId, entidade: "Aluno", entidadeId: alunoId,
          operacao: reativado ? "ATUALIZACAO" : "CRIACAO", valoresDepois: { origem: "LEAD", leadId: lead.id, reativado },
          ip: contexto.ip, dispositivo: contexto.dispositivo,
        } });
        return { alunoId, reativado, jaConvertido: false };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (erro) {
      if (erro instanceof AppError) throw erro;
      if (typeof erro === "object" && erro && "code" in erro && erro.code === "P2034") throw new AppError("A conversão foi atualizada por outra operação. Tente novamente.", 409);
      throw erro;
    }
  }
}
