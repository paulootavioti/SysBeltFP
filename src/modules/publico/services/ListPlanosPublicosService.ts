import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";

const INCLUI_DOJO = [
  "Dashboard", "Gestão Acadêmica", "Gestão Financeira", "Gestão Comercial",
  "CRM de alunos e responsáveis", "Graduação", "Aulas", "Usuários e demais módulos atuais",
];

/** Catálogo deliberadamente pequeno: não expõe IDs, regras legadas ou recursos técnicos. */
export class ListPlanosPublicosService {
  async execute() {
    const prisma = prismaDaRequisicao();
    const planos = await prisma.planoPlataforma.findMany({
      where: { ativo: true },
      orderBy: { precoFixoCentavos: "asc" },
      select: { nome: true, descricao: true, tipoCobranca: true, precoFixoCentavos: true, recursos: true },
    });

    return planos.map((plano) => ({
      nome: plano.nome,
      precoCentavos: plano.precoFixoCentavos ?? 0,
      descricaoCurta: plano.descricao ?? "Plano mensal Sys Belt.",
      inclui: [
        ...INCLUI_DOJO,
        ...(plano.recursos.includes("SDR_WHATSAPP") ? ["SDR para WhatsApp"] : []),
        ...(plano.recursos.includes("TRAFEGO") ? ["Tráfego"] : []),
        ...(plano.recursos.includes("SOCIAL_MEDIA") ? ["Social Media"] : []),
      ],
    }));
  }
}
