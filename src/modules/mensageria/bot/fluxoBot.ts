import { AppError } from "../../../shared/errors/AppError";

export const IDS_PASSOS_BOT = ["NOME", "PARA_QUEM", "SITUACAO", "TURNO", "TELEFONE_INSTAGRAM", "CONSENTIMENTO", "TRANSFERENCIA"] as const;
export type IdPassoBotConfiguravel = typeof IDS_PASSOS_BOT[number];
export type TipoPassoBotConfiguravel = "TEXTO_LIVRE" | "BOTOES" | "CONDICIONAL" | "AUTOMATICO";

export interface PassoBotConfiguravel {
  id: IdPassoBotConfiguravel;
  tipo: TipoPassoBotConfiguravel;
  campo?: string;
  texto: string;
  opcoes?: string[];
  regra?: string;
}

export const PASSOS_PADRAO: PassoBotConfiguravel[] = [
  { id: "NOME", tipo: "TEXTO_LIVRE", campo: "nome", texto: "Oi! Que bom ter você por aqui. Sou o assistente da {academia}. Para começar, como você se chama?" },
  { id: "PARA_QUEM", tipo: "BOTOES", campo: "tipoContato", texto: "Prazer, {nome}! Para quem é o treino?", opcoes: ["Para mim", "Para meu filho"], regra: "Para responsável, coleta nome e nascimento do praticante." },
  { id: "SITUACAO", tipo: "BOTOES", campo: "situacao", texto: "Qual destas opções descreve melhor sua situação hoje?", opcoes: ["Nunca treinei", "Treino em outra academia", "Já treinei aqui e quero voltar"], regra: "Ex-aluno é localizado pelo telefone e vinculado ao cadastro existente." },
  { id: "TURNO", tipo: "BOTOES", campo: "turnoPreferido", texto: "Qual turno funciona melhor para o treino?", opcoes: ["Manhã", "Tarde", "Noite"] },
  { id: "TELEFONE_INSTAGRAM", tipo: "CONDICIONAL", campo: "telefoneE164", texto: "Qual WhatsApp a equipe pode usar para falar com você?", regra: "Exibido somente no Instagram; o WhatsApp já fornece o telefone." },
  { id: "CONSENTIMENTO", tipo: "BOTOES", campo: "consentimento", texto: "Você autoriza?", opcoes: ["Sim, autorizo", "Prefiro não"], regra: "O texto legal versionado é incluído automaticamente e não pode ser alterado aqui." },
  { id: "TRANSFERENCIA", tipo: "AUTOMATICO", texto: "Obrigado! Vou encaminhar seus dados para a equipe, que continuará o atendimento por aqui.", regra: "Cria ou vincula o lead, aplica SLA e transfere para a equipe." },
];

const metadata = new Map(PASSOS_PADRAO.map((passo) => [passo.id, passo]));

export function normalizarPassosBot(valor: unknown): PassoBotConfiguravel[] {
  const recebidos = Array.isArray(valor) ? valor : [];
  const porId = new Map(recebidos.filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => [String(item.id), item]));
  return PASSOS_PADRAO.map((padrao) => {
    const recebido = porId.get(padrao.id);
    const texto = typeof recebido?.texto === "string" && recebido.texto.trim() ? recebido.texto.trim() : padrao.texto;
    return { ...padrao, texto };
  });
}

export function validarPassosBot(valor: unknown): PassoBotConfiguravel[] {
  if (!Array.isArray(valor) || valor.length !== IDS_PASSOS_BOT.length) throw new AppError("O fluxo deve conter os sete passos obrigatórios.");
  const ids = valor.map((item) => item && typeof item === "object" ? String((item as Record<string, unknown>).id) : "");
  if (new Set(ids).size !== IDS_PASSOS_BOT.length || IDS_PASSOS_BOT.some((id) => !ids.includes(id))) throw new AppError("O fluxo contém passos ausentes ou duplicados.");
  return IDS_PASSOS_BOT.map((id) => {
    const item = valor.find((passo) => passo && typeof passo === "object" && (passo as Record<string, unknown>).id === id) as Record<string, unknown>;
    const padrao = metadata.get(id)!;
    const texto = typeof item.texto === "string" ? item.texto.trim() : "";
    if (!texto || texto.length > 800) throw new AppError(`Informe o texto do passo ${id} com até 800 caracteres.`);
    if (item.tipo !== padrao.tipo || (padrao.campo && item.campo !== padrao.campo)) throw new AppError(`A estrutura do passo ${id} não pode ser alterada.`);
    return { ...padrao, texto };
  });
}

export function textoDoPasso(passos: PassoBotConfiguravel[], id: IdPassoBotConfiguravel, variaveis: Record<string, string> = {}) {
  let texto = passos.find((passo) => passo.id === id)?.texto ?? metadata.get(id)!.texto;
  for (const [chave, valor] of Object.entries(variaveis)) texto = texto.split(`{${chave}}`).join(valor);
  return texto;
}
