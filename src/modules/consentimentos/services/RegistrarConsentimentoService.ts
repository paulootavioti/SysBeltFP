import type { TipoConsentimento } from "@prisma/client";

import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import { obterContextoRequisicao } from "../../../shared/context/contextoRequisicao";
import { AuditLogService } from "../../../shared/services/AuditLogService";
import { VERSAO_POLITICA_ATUAL } from "../constants";

const auditLogService = new AuditLogService();

interface RegistrarConsentimentoDTO {
  alunoId: number;
  tipo: TipoConsentimento;
  concedido: boolean;
  // quem consentiu, quando o aluno é menor de idade
  responsavelId?: number | null;
  observacao?: string | null;
  versaoPolitica?: string;
}

export class RegistrarConsentimentoService {
  async execute(
    dto: RegistrarConsentimentoDTO,
    unidadeId: number | null,
    registradoPorId: number
  ) {
    const aluno = await prisma.aluno.findUnique({
      where: { id: dto.alunoId },
      select: { id: true, unidadeId: true, dataNascimento: true },
    });

    if (!aluno) {
      throw new AppError("Aluno não encontrado.", 404);
    }

    garantirAcessoUnidade(unidadeId, aluno.unidadeId, "Aluno não encontrado.");

    if (dto.responsavelId) {
      const responsavel = await prisma.responsavel.findUnique({
        where: { id: dto.responsavelId },
        select: { alunoId: true },
      });

      if (!responsavel || responsavel.alunoId !== aluno.id) {
        throw new AppError("O responsável informado não é responsável por este aluno.");
      }
    }

    const contexto = obterContextoRequisicao();

    const consentimento = await prisma.consentimento.create({
      data: {
        unidadeId: aluno.unidadeId,
        alunoId: aluno.id,
        tipo: dto.tipo,
        concedido: dto.concedido,
        responsavelId: dto.responsavelId ?? null,
        versaoPolitica: dto.versaoPolitica ?? VERSAO_POLITICA_ATUAL,
        registradoPorId,
        observacao: dto.observacao ?? null,
        ip: contexto.ip,
        dispositivo: contexto.dispositivo,
      },
    });

    // O booleano do Aluno é a projeção do estado atual, lida no caminho
    // quente (publicação de foto de treino). Escrever os dois aqui, num
    // único lugar, é o que impede o livro de registro e a projeção de
    // divergirem.
    if (dto.tipo === "USO_IMAGEM") {
      await prisma.aluno.update({
        where: { id: aluno.id },
        data: { autorizaUsoImagem: dto.concedido },
      });
    }

    await auditLogService.registrar({
      unidadeId: aluno.unidadeId,
      usuarioId: registradoPorId,
      entidade: "Consentimento",
      entidadeId: consentimento.id,
      operacao: "CONSENTIMENTO",
      valoresDepois: {
        alunoId: aluno.id,
        tipo: dto.tipo,
        concedido: dto.concedido,
        versaoPolitica: consentimento.versaoPolitica,
      },
    });

    return consentimento;
  }
}
