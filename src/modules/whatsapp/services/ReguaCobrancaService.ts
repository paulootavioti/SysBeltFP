import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { formatarDataBR, inicioDoDiaUTC, somarDiasUTC } from "../../../shared/utils/dataCalendario";
import { EnviarMensagemWhatsappService, type ResultadoEnvio } from "./EnviarMensagemWhatsappService";
import { destinatarioDoAluno, primeiroNome } from "../utils/destinatario";

export interface ResultadoRegua {
  avaliadas: number;
  enviadas: number;
  jaAvisadas: number;
  semConsentimento: number;
  semTelefone: number;
  semRecurso: number;
  falharam: number;
}

// Quantos dias antes do vencimento sai o aviso de "está chegando". Três é
// o intervalo que dá tempo de pagar sem virar cobrança insistente.
const DIAS_DE_ANTECEDENCIA = 3;

/**
 * Régua de cobrança: avisa quem tem mensalidade vencendo e quem já venceu.
 *
 * Roda pelo cron, uma vez por dia. É seguro rodar de novo no mesmo dia: a
 * chave de idempotência identifica o FATO ("mensalidade 123 vencendo"),
 * não a execução, então o responsável não recebe a mesma cobrança duas
 * vezes por causa de um retry.
 */
export class ReguaCobrancaService {
  private readonly enviar = new EnviarMensagemWhatsappService();

  async execute(hoje: Date = new Date(), unidadeId?: number): Promise<ResultadoRegua> {
    const prisma = prismaDaRequisicao();
    const contador: ResultadoRegua = {
      avaliadas: 0,
      enviadas: 0,
      jaAvisadas: 0,
      semConsentimento: 0,
      semTelefone: 0,
      semRecurso: 0,
      falharam: 0,
    };

    const inicioHoje = inicioDoDiaUTC(hoje);
    const alvoAntecedencia = somarDiasUTC(inicioHoje, DIAS_DE_ANTECEDENCIA);

    // Vencimento é data de calendário (meia-noite UTC), então a
    // comparação é de igualdade de dia — não de instante. Comparar com
    // `new Date()` cru erraria o dia pra quem roda o cron de madrugada.
    const vencendo = await prisma.mensalidade.findMany({
      where: {
        status: "ABERTA",
        vencimento: alvoAntecedencia,
        ...(unidadeId ? { unidadeId } : {}),
      },
      include: { aluno: { select: { id: true, nome: true } } },
    });

    const vencidas = await prisma.mensalidade.findMany({
      where: {
        status: { in: ["ABERTA", "VENCIDA"] },
        vencimento: { lt: inicioHoje },
        ...(unidadeId ? { unidadeId } : {}),
      },
      include: { aluno: { select: { id: true, nome: true } } },
    });

    for (const mensalidade of vencendo) {
      await this.avisar(contador, mensalidade, "MENSALIDADE_VENCENDO");
    }

    for (const mensalidade of vencidas) {
      await this.avisar(contador, mensalidade, "MENSALIDADE_VENCIDA");
    }

    return contador;
  }

  private async avisar(
    contador: ResultadoRegua,
    mensalidade: {
      id: number;
      unidadeId: number;
      valorFinal: number;
      vencimento: Date;
      aluno: { id: number; nome: string };
    },
    template: "MENSALIDADE_VENCENDO" | "MENSALIDADE_VENCIDA"
  ) {
    contador.avaliadas++;

    const destinatario = await destinatarioDoAluno(mensalidade.aluno.id);

    if (!destinatario) {
      contador.semTelefone++;
      return;
    }

    const { resultado } = await this.enviar.execute({
      unidadeId: mensalidade.unidadeId,
      template,
      parametros: [
        primeiroNome(destinatario.nome),
        primeiroNome(mensalidade.aluno.nome),
        formatarDataBR(mensalidade.vencimento),
        mensalidade.valorFinal.toFixed(2).replace(".", ","),
      ],
      telefone: destinatario.telefone,
      alunoId: mensalidade.aluno.id,
      responsavelId: destinatario.responsavelId,
      // O fato é "esta mensalidade, neste estágio da régua" — e não a
      // rodada de hoje. É o que impede o cron de reenviar a mesma
      // cobrança amanhã, e no dia seguinte, enquanto ela seguir em aberto.
      chaveIdempotencia: `mensalidade-${mensalidade.id}-${template.toLowerCase()}`,
    });

    contabilizar(contador, resultado);
  }
}

export function contabilizar(contador: ResultadoRegua, resultado: ResultadoEnvio) {
  if (resultado === "ENVIADA") contador.enviadas++;
  else if (resultado === "JA_ENVIADA") contador.jaAvisadas++;
  else if (resultado === "SEM_CONSENTIMENTO") contador.semConsentimento++;
  else if (resultado === "SEM_RECURSO_NO_PLANO") contador.semRecurso++;
  else if (resultado === "SEM_TELEFONE") contador.semTelefone++;
  else contador.falharam++;
}
