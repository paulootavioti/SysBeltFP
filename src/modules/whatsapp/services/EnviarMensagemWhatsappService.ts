import { Prisma } from "@prisma/client";

import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { ConsultarConsentimentoService } from "../../consentimentos/services/ConsultarConsentimentoService";
import { obterProvedorMensagens } from "../providers";
import { TEMPLATES, type NomeTemplate } from "../templates";
import { normalizarTelefoneBR } from "../utils/telefone";
import { tenantTemRecurso } from "../../concessaoPlataforma/recursos";

const consultarConsentimento = new ConsultarConsentimentoService();

export type ResultadoEnvio =
  | "ENVIADA"
  | "JA_ENVIADA"
  | "SEM_CONSENTIMENTO"
  | "SEM_RECURSO_NO_PLANO"
  | "SEM_TELEFONE"
  | "FALHOU";

interface EnviarMensagemDTO {
  unidadeId: number;
  template: NomeTemplate;
  parametros: string[];
  /** telefone bruto, como está no cadastro */
  telefone: string | null | undefined;
  alunoId?: number | null;
  responsavelId?: number | null;
  /**
   * Identifica o FATO comunicado, não a tentativa: "mensalidade 123
   * vencida" tem sempre a mesma chave. É o que impede a régua de cobrança,
   * rodando de novo, de encher o WhatsApp do responsável.
   */
  chaveIdempotencia: string;
}

export class EnviarMensagemWhatsappService {
  constructor(
    private readonly temRecurso: typeof tenantTemRecurso = tenantTemRecurso,
  ) {}

  async execute(dto: EnviarMensagemDTO): Promise<{ resultado: ResultadoEnvio; detalhe?: string }> {
    const prisma = prismaDaRequisicao();
    const definicao = TEMPLATES[dto.template];

    // WhatsApp é recurso de plano: custa por mensagem e exige número e
    // templates aprovados na Meta. Quem não contratou não envia.
    //
    // A checagem fica aqui, no ponto único por onde toda mensagem passa,
    // e não em cada gatilho (régua de cobrança, aviso de entrada, lembrete
    // de aula) — gatilho novo nasce coberto sem ninguém lembrar disso.
    //
    // Não grava registro: diferente de "sem consentimento", que é história
    // que a LGPD pede pra guardar, concessão sem o recurso não é um fato
    // sobre o aluno — gravar encheria a tabela de linhas sem valor.
    if (!(await this.temRecurso("WHATSAPP"))) {
      return { resultado: "SEM_RECURSO_NO_PLANO" };
    }

    const telefone = normalizarTelefoneBR(dto.telefone);

    if (!telefone) {
      return { resultado: "SEM_TELEFONE" };
    }

    // Mensagem iniciada pela academia é comunicação ativa: precisa do
    // consentimento do titular. Sem ele, o registro fica gravado como
    // bloqueado — some do envio, mas não some da história.
    if (dto.alunoId) {
      const liberado = await consultarConsentimento.temConsentimentoValido(
        dto.alunoId,
        "COMUNICACOES"
      );

      if (!liberado) {
        await this.registrarBloqueio(dto, telefone);

        return { resultado: "SEM_CONSENTIMENTO" };
      }
    }

    // Reserva a chave antes de enviar: se duas execuções da régua rodarem
    // ao mesmo tempo, o índice único deixa só uma passar.
    let registro;

    try {
      registro = await prisma.mensagemWhatsapp.create({
        data: {
          unidadeId: dto.unidadeId,
          alunoId: dto.alunoId ?? null,
          responsavelId: dto.responsavelId ?? null,
          telefone,
          template: definicao.nome,
          parametros: dto.parametros as Prisma.InputJsonValue,
          chaveIdempotencia: dto.chaveIdempotencia,
          status: "PENDENTE",
        },
      });
    } catch (erro) {
      if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002") {
        return { resultado: "JA_ENVIADA" };
      }

      throw erro;
    }

    const provedor = obterProvedorMensagens();

    try {
      const { provedorMensagemId } = await provedor.enviarTemplate({
        telefone,
        template: definicao,
        parametros: dto.parametros,
      });

      await prisma.mensagemWhatsapp.update({
        where: { id: registro.id },
        data: {
          status: "ENVIADA",
          provedorMensagemId,
          enviadaEm: new Date(),
          tentativas: { increment: 1 },
        },
      });

      return { resultado: "ENVIADA" };
    } catch (erro) {
      const detalhe = erro instanceof Error ? erro.message : "erro desconhecido";

      // A falha não derruba quem chamou: uma cobrança que não saiu não
      // deve impedir as outras da mesma rodada. Fica registrada pra ser
      // reenviada depois.
      await prisma.mensagemWhatsapp.update({
        where: { id: registro.id },
        data: { status: "FALHOU", erro: detalhe, tentativas: { increment: 1 } },
      });

      return { resultado: "FALHOU", detalhe };
    }
  }

  private async registrarBloqueio(dto: EnviarMensagemDTO, telefone: string) {
    const prisma = prismaDaRequisicao();
    const definicao = TEMPLATES[dto.template];

    await prisma.mensagemWhatsapp
      .create({
        data: {
          unidadeId: dto.unidadeId,
          alunoId: dto.alunoId ?? null,
          responsavelId: dto.responsavelId ?? null,
          telefone,
          template: definicao.nome,
          parametros: dto.parametros as Prisma.InputJsonValue,
          chaveIdempotencia: dto.chaveIdempotencia,
          status: "BLOQUEADA_SEM_CONSENTIMENTO",
          erro: "Sem consentimento de comunicações registrado para o aluno.",
        },
      })
      .catch(() => {
        // já existe registro pra este fato — nada a acrescentar.
      });
  }
}
