import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { GetAulaService } from "../../aulas/services/GetAulaService";

interface Solicitante { id: number; perfil: string; unidadeId: number | null }

interface RegistroBloco {
  chaveBloco: string;
  tipo: "AQUECIMENTO" | "JOGO" | "TECNICA" | "SPARRING" | "PAUSA" | "ALONGAMENTO";
  nome: string;
  ordem: number;
  duracaoPrevistaSegundos: number;
  duracaoRealSegundos: number;
  status: "CUMPRIDO" | "PULADO";
  iniciadoEm: string;
  finalizadoEm: string;
  tecnicaId?: number | null;
}

export class RegistrarExecucaoBlocoService {
  async execute(aulaId: number, dados: RegistroBloco, solicitante: Solicitante) {
    const prisma = prismaDaRequisicao();
    await new GetAulaService().execute(aulaId, solicitante);

    return prisma.$transaction(async (tx) => {
      const registro = await tx.execucaoBlocoAula.upsert({
        where: { aulaId_chaveBloco: { aulaId, chaveBloco: dados.chaveBloco } },
        create: {
          aulaId,
          chaveBloco: dados.chaveBloco,
          tipo: dados.tipo,
          nome: dados.nome,
          ordem: dados.ordem,
          duracaoPrevistaSegundos: dados.duracaoPrevistaSegundos,
          duracaoRealSegundos: dados.duracaoRealSegundos,
          status: dados.status,
          iniciadoEm: new Date(dados.iniciadoEm),
          finalizadoEm: new Date(dados.finalizadoEm),
        },
        update: {
          duracaoRealSegundos: dados.duracaoRealSegundos,
          status: dados.status,
          finalizadoEm: new Date(dados.finalizadoEm),
        },
      });

      if (dados.tecnicaId && dados.status === "CUMPRIDO") {
        await tx.aula.update({
          where: { id: aulaId },
          data: { tecnicasRealizadas: { connect: { id: dados.tecnicaId } } },
        });
      }
      return registro;
    });
  }
}
