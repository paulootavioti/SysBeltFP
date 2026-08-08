// Templates de mensagem do WhatsApp.
//
// A Meta só deixa a empresa INICIAR conversa por template previamente
// aprovado — texto livre só vale como resposta, dentro da janela de 24h
// depois que a pessoa escreveu. Por isso todo aviso que a academia manda
// (cobrança, lembrete, entrada da criança) precisa estar aqui e ter sido
// aprovado antes.
//
// Cada `corpo` abaixo é o texto EXATO a cadastrar no Gerenciador do
// WhatsApp Business, com {{1}}, {{2}}... na mesma ordem dos `parametros`.
// Se o texto aprovado divergir daqui, o envio falha com erro de
// parâmetro — por isso os dois moram juntos.
//
// Categoria importa no custo e na aprovação: UTILITY (aviso ligado a algo
// que a pessoa já contratou) passa mais fácil e é mais barato que
// MARKETING. Todos os nossos são UTILITY de propósito.

export interface DefinicaoTemplate {
  /** nome exato cadastrado na Meta (minúsculo, com underscore) */
  nome: string;
  categoria: "UTILITY" | "MARKETING" | "AUTHENTICATION";
  idioma: string;
  /** texto a cadastrar, com {{n}} nas variáveis */
  corpo: string;
  /** o que cada {{n}} significa, na ordem */
  parametros: string[];
}

export const TEMPLATES = {
  MENSALIDADE_VENCENDO: {
    nome: "mensalidade_vencendo",
    categoria: "UTILITY",
    idioma: "pt_BR",
    corpo:
      "Olá, {{1}}! A mensalidade de {{2}} vence em {{3}}, no valor de R$ {{4}}. " +
      "Você pode pagar por PIX direto no Portal da Família. Qualquer dúvida, é só responder por aqui.",
    parametros: ["nome do responsável", "nome do aluno", "data de vencimento", "valor"],
  },

  MENSALIDADE_VENCIDA: {
    nome: "mensalidade_vencida",
    categoria: "UTILITY",
    idioma: "pt_BR",
    corpo:
      "Olá, {{1}}. A mensalidade de {{2}}, que venceu em {{3}}, consta em aberto no valor de R$ {{4}}. " +
      "Se já pagou, desconsidere esta mensagem. Se preferir, fale com a gente por aqui que a gente resolve junto.",
    parametros: ["nome do responsável", "nome do aluno", "data de vencimento", "valor"],
  },

  // O aviso de entrada/saída é o que mais tranquiliza pai de criança
  // pequena — e o que mais incomoda se vier atrasado ou duplicado.
  ENTRADA_ALUNO: {
    nome: "entrada_aluno",
    categoria: "UTILITY",
    idioma: "pt_BR",
    corpo: "{{1}} chegou na academia às {{2}}. 🥋",
    parametros: ["nome do aluno", "horário"],
  },

  SAIDA_ALUNO: {
    nome: "saida_aluno",
    categoria: "UTILITY",
    idioma: "pt_BR",
    corpo: "{{1}} saiu da academia às {{2}}.",
    parametros: ["nome do aluno", "horário"],
  },

  LEMBRETE_AULA: {
    nome: "lembrete_aula",
    categoria: "UTILITY",
    idioma: "pt_BR",
    corpo: "Lembrete: {{1}} tem aula de {{2}} hoje às {{3}}. Até já!",
    parametros: ["nome do aluno", "modalidade", "horário"],
  },

  AULA_CANCELADA: {
    nome: "aula_cancelada",
    categoria: "UTILITY",
    idioma: "pt_BR",
    corpo:
      "Aviso: a aula de {{1}} de hoje, às {{2}}, foi cancelada. {{3}} " +
      "Desculpe o transtorno — qualquer dúvida, responda por aqui.",
    parametros: ["turma", "horário", "motivo ou orientação"],
  },

  GRADUACAO_PROXIMA: {
    nome: "graduacao_proxima",
    categoria: "UTILITY",
    idioma: "pt_BR",
    corpo:
      "Boa notícia! {{1}} está apto(a) à graduação para a faixa {{2}}. " +
      "A cerimônia está prevista para {{3}}. Parabéns pela dedicação! 🥋",
    parametros: ["nome do aluno", "faixa", "data prevista"],
  },
} as const satisfies Record<string, DefinicaoTemplate>;

export type NomeTemplate = keyof typeof TEMPLATES;

/** Lista para conferência na hora de cadastrar os templates na Meta. */
export function listarTemplates(): DefinicaoTemplate[] {
  return Object.values(TEMPLATES);
}
