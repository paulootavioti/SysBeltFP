import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { obterUnidadePublicaId } from "../../../shared/utils/unidadePublica";
import { normalizarTelefoneBR } from "../../whatsapp/utils/telefone";
import { AppError } from "../../../shared/errors/AppError";

interface CriarLeadPublicoDTO {
  nome: string;
  contato: string;
  interesse: string;
}

export class CriarLeadPublicoService {
  async execute(dados: CriarLeadPublicoDTO) {
    const prisma = prismaDaRequisicao();
    const unidadeId = obterUnidadePublicaId();
    const telefoneE164 = normalizarTelefoneBR(dados.contato);
    if (!telefoneE164) throw new AppError("Informe um WhatsApp válido.");
    const canal = await prisma.canalCaptacao.upsert({
      where: { slug: `legado-${unidadeId}` },
      create: { unidadeId, nome: "Landing page legada", slug: `legado-${unidadeId}` },
      update: {},
    });

    return prisma.lead.upsert({
      where: { unidadeId_telefoneE164: { unidadeId, telefoneE164 } },
      create: { unidadeId, canalId: canal.id, nome: dados.nome, telefoneE164, observacoes: `Interesse legado: ${dados.interesse}` },
      update: {},
    });
  }
}
