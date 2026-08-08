import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { traduzirPlanoDuplicado } from "./CreateContaService";
import { ehRecursoConhecido } from "../utils/recursosDoPlano";

interface PlanoDTO {
  nome: string;
  descricao?: string | null;
  alunosPorBloco: number;
  precoPorBlocoCentavos: number;
  blocosMinimos?: number;
  recursos?: string[];
}

export class ListPlanosPlataformaService {
  async execute(apenasAtivos: boolean) {
    return prisma.planoPlataforma.findMany({
      where: apenasAtivos ? { ativo: true } : {},
      orderBy: { precoPorBlocoCentavos: "asc" },
    });
  }
}

export class CreatePlanoPlataformaService {
  async execute(data: PlanoDTO) {
    const recursos = validarRecursos(data.recursos);

    try {
      return await prisma.planoPlataforma.create({
        data: {
          nome: data.nome.trim(),
          descricao: data.descricao?.trim() || null,
          alunosPorBloco: data.alunosPorBloco,
          precoPorBlocoCentavos: data.precoPorBlocoCentavos,
          blocosMinimos: data.blocosMinimos ?? 1,
          recursos,
        },
      });
    } catch (erro) {
      throw traduzirPlanoDuplicado(erro);
    }
  }
}

export class UpdatePlanoPlataformaService {
  async execute(id: number, data: PlanoDTO) {
    const plano = await prisma.planoPlataforma.findUnique({ where: { id } });

    if (!plano) {
      throw new AppError("Plano da plataforma não encontrado.", 404);
    }

    const recursos = validarRecursos(data.recursos);

    try {
      return await prisma.planoPlataforma.update({
        where: { id },
        data: {
          nome: data.nome.trim(),
          descricao: data.descricao?.trim() || null,
          alunosPorBloco: data.alunosPorBloco,
          precoPorBlocoCentavos: data.precoPorBlocoCentavos,
          blocosMinimos: data.blocosMinimos ?? 1,
          recursos,
        },
      });
    } catch (erro) {
      throw traduzirPlanoDuplicado(erro);
    }
  }
}

// Recurso desconhecido é erro, não silêncio: um "WHATSAP" com erro de
// digitação viraria um plano que promete algo que nenhuma checagem
// reconhece, e o cliente pagaria por um recurso que nunca liga.
function validarRecursos(recursos: string[] | undefined): string[] {
  if (!recursos) return [];

  const desconhecido = recursos.find((recurso) => !ehRecursoConhecido(recurso));

  if (desconhecido) {
    throw new AppError(`Recurso desconhecido no plano: "${desconhecido}".`);
  }

  return [...new Set(recursos)];
}
