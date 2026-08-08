import { Prisma } from "@prisma/client";

import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";

interface CreateContaDTO {
  nome: string;
  documento?: string | null;
  emailCobranca?: string | null;
  nomePrimeiraUnidade?: string | null;
  planoId: number;
  diaVencimento?: number;
  precoPorBlocoCentavos?: number | null;
  diasDeTeste?: number;
}

// Entrada de um assinante novo. Cria a conta, a primeira unidade e a
// assinatura de uma vez — os três nascem juntos ou nenhum nasce, porque
// conta sem unidade não tem onde cadastrar aluno e conta sem assinatura não
// entra no fechamento.
export class CreateContaService {
  async execute(data: CreateContaDTO) {
    const plano = await prisma.planoPlataforma.findUnique({ where: { id: data.planoId } });

    if (!plano) {
      throw new AppError("Plano da plataforma não encontrado.", 404);
    }

    if (!plano.ativo) {
      throw new AppError("Este plano não está mais disponível para contratação.");
    }

    const diasDeTeste = data.diasDeTeste ?? 0;

    return prisma.$transaction(async (tx) => {
      const conta = await tx.conta.create({
        data: {
          nome: data.nome.trim(),
          documento: data.documento?.trim() || null,
          emailCobranca: data.emailCobranca?.trim() || null,
        },
      });

      await tx.unidade.create({
        data: {
          contaId: conta.id,
          nome: data.nomePrimeiraUnidade?.trim() || data.nome.trim(),
        },
      });

      const assinatura = await tx.assinaturaPlataforma.create({
        data: {
          contaId: conta.id,
          planoId: plano.id,
          // Com período de teste a assinatura começa em TESTE (o
          // fechamento ignora); sem período de teste, já nasce cobrando.
          status: diasDeTeste > 0 ? "TESTE" : "ATIVA",
          fimTesteEm: diasDeTeste > 0 ? somarDias(new Date(), diasDeTeste) : null,
          diaVencimento: data.diaVencimento ?? 10,
          precoPorBlocoCentavos: data.precoPorBlocoCentavos ?? null,
        },
        include: { plano: true },
      });

      return { conta, assinatura };
    });
  }
}

function somarDias(data: Date, dias: number): Date {
  const resultado = new Date(data);
  resultado.setDate(resultado.getDate() + dias);

  return resultado;
}

export function traduzirPlanoDuplicado(erro: unknown): unknown {
  if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002") {
    return new AppError("Já existe um plano da plataforma com esse nome.");
  }

  return erro;
}
