import type { Prisma, PrismaClient, SituacaoLead, TipoContatoLead } from "@prisma/client";
import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { normalizarTelefoneBR } from "../../whatsapp/utils/telefone";
import { obterContextoRequisicao } from "../../../shared/context/contextoRequisicao";
import { TEXTO_CONSENTIMENTO_COMUNICACOES, TEXTO_CONSENTIMENTO_DADOS, VERSAO_CONSENTIMENTO_LEAD } from "../consentimentos";

type Entrada = {
  nome: string; telefone: string; email?: string; tipoContato: TipoContatoLead;
  praticanteNome?: string; praticanteNascimento?: string; situacao: SituacaoLead;
  modalidadeInteresseId: number; turnoPreferido: string[]; observacoes?: string;
  consentimentoDados: true; consentimentoComunicacoes: boolean; website?: string;
  utmSource?: string; utmMedium?: string; utmCampaign?: string; referrer?: string;
};

type ClienteTransacao = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

function telefoneDePessoa(pessoa: { telefone: string | null; whatsapp: string | null }, alvo: string) {
  return normalizarTelefoneBR(pessoa.whatsapp) === alvo || normalizarTelefoneBR(pessoa.telefone) === alvo;
}

async function registrarConsentimentos(tx: ClienteTransacao, leadId: number, comunicacoes: boolean) {
  const { ip, dispositivo } = obterContextoRequisicao();
  const dados: Prisma.LeadConsentimentoCreateManyInput[] = [{
    leadId, finalidade: "TRATAMENTO_DADOS", textoAceito: TEXTO_CONSENTIMENTO_DADOS,
    versao: VERSAO_CONSENTIMENTO_LEAD, ip, userAgent: dispositivo,
  }];
  if (comunicacoes) dados.push({
    leadId, finalidade: "COMUNICACOES", textoAceito: TEXTO_CONSENTIMENTO_COMUNICACOES,
    versao: VERSAO_CONSENTIMENTO_LEAD, ip, userAgent: dispositivo,
  });
  await tx.leadConsentimento.createMany({ data: dados });
}

export class CriarLeadPublicoV2Service {
  async execute(slug: string, entrada: Entrada) {
    if (entrada.website) return;
    const telefoneE164 = normalizarTelefoneBR(entrada.telefone);
    if (!telefoneE164) throw new AppError("Informe um WhatsApp válido.");
    const prisma = prismaDaRequisicao();

    try {
      await prisma.$transaction(async (tx) => {
      const canal = await tx.canalCaptacao.findFirst({
        where: { slug, ativo: true, unidade: { ativo: true, conta: { ativo: true } } },
        select: { id: true, unidadeId: true, unidade: { select: { contaId: true } } },
      });
      if (!canal) return;

      const unidades = await tx.unidade.findMany({ where: { contaId: canal.unidade.contaId }, select: { id: true } });
      const unidadeIds = unidades.map(({ id }) => id);
      const existente = await tx.lead.findFirst({ where: { unidadeId: { in: unidadeIds }, telefoneE164 } });
      if (existente) {
        await registrarConsentimentos(tx, existente.id, entrada.consentimentoComunicacoes);
        return;
      }

      const [alunos, responsaveis, modalidade] = await Promise.all([
        tx.aluno.findMany({ where: { unidadeId: { in: unidadeIds } }, select: { id: true, ativo: true, telefone: true, whatsapp: true } }),
        tx.responsavel.findMany({ where: { unidadeId: { in: unidadeIds } }, select: { telefone: true, whatsapp: true } }),
        tx.modalidade.findFirst({ where: { id: entrada.modalidadeInteresseId, unidadeId: canal.unidadeId, ativo: true }, select: { id: true } }),
      ]);
      if (!modalidade) return;
      const aluno = alunos.find((item) => telefoneDePessoa(item, telefoneE164));
      if (aluno?.ativo || responsaveis.some((item) => telefoneDePessoa(item, telefoneE164))) return;

      const criado = await tx.lead.create({
        data: {
          unidadeId: canal.unidadeId, canalId: canal.id, nome: entrada.nome, telefoneE164,
          email: entrada.email || null, tipoContato: entrada.tipoContato,
          praticanteNome: entrada.praticanteNome || null,
          praticanteNascimento: entrada.praticanteNascimento ? new Date(`${entrada.praticanteNascimento}T00:00:00.000Z`) : null,
          situacao: aluno ? "EX_ALUNO" : entrada.situacao,
          modalidadeInteresseId: modalidade.id, turnoPreferido: entrada.turnoPreferido,
          observacoes: entrada.observacoes || null, alunoId: aluno?.id ?? null,
          proximaAcaoEm: new Date(Date.now() + 15 * 60 * 1000),
          utmSource: entrada.utmSource || null, utmMedium: entrada.utmMedium || null,
          utmCampaign: entrada.utmCampaign || null, referrer: entrada.referrer || null,
          eventos: { create: { unidadeId: canal.unidadeId, tipo: "CAPTADO", descricao: "Lead captado pelo formulário público.", payload: { canalId: canal.id } } },
        },
      });
      await registrarConsentimentos(tx, criado.id, entrada.consentimentoComunicacoes);
      }, { isolationLevel: "Serializable" });
    } catch (erro) {
      // Duas submissões simultâneas podem chegar antes de uma enxergar a
      // outra. A constraint e o isolamento serializável mantêm um único
      // lead; publicamente ambas recebem a mesma resposta genérica.
      if (typeof erro === "object" && erro && "code" in erro && (erro.code === "P2002" || erro.code === "P2034")) return;
      throw erro;
    }
  }
}
