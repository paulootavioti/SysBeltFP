import { normalizarTelefoneBR } from "../../whatsapp/utils/telefone";
import { TEXTO_CONSENTIMENTO_DADOS, VERSAO_CONSENTIMENTO_LEAD } from "../../leads/consentimentos";
import { normalizarPassosBot, textoDoPasso, type PassoBotConfiguravel } from "./fluxoBot";

export type PassoBot = "INICIO" | "NOME" | "PARA_QUEM" | "PRATICANTE_NOME" | "PRATICANTE_NASCIMENTO" |
  "SITUACAO" | "TURNO" | "TELEFONE_INSTAGRAM" | "CONSENTIMENTO" | "FINALIZADO";

export interface EstadoBot {
  passo: PassoBot;
  respostas: Record<string, string | boolean>;
  canal: "WHATSAPP" | "INSTAGRAM";
  academia: string;
  contatoExternoId: string;
}

export interface MensagemBot { texto: string; botoes?: string[]; }
export type EfeitoBot = { tipo: "TRANSFERIR_EQUIPE"; motivo: string } |
  { tipo: "CRIAR_LEAD" } | { tipo: "REGISTRAR_RECUSA_CONSENTIMENTO" };
export interface ResultadoBot { estado: EstadoBot; mensagens: MensagemBot[]; efeitos: EfeitoBot[]; }

const pediuPessoa = /\b(humano|pessoa|atendente|recep(?:ç|c)ão|falar com algu[eé]m)\b/i;
const perguntouValor = /\b(pre[çc]o|valor|desconto|plano|mensalidade|quanto custa)\b/i;
const texto = (valor: string) => valor.trim().replace(/\s+/g, " ");
const opcao = (valor: string) => texto(valor).toLowerCase();

function resultado(estado: EstadoBot, mensagens: MensagemBot[], efeitos: EfeitoBot[] = []): ResultadoBot {
  return { estado, mensagens, efeitos };
}

function avancar(estado: EstadoBot, passo: PassoBot, respostas: EstadoBot["respostas"], mensagem: MensagemBot, efeitos: EfeitoBot[] = []) {
  return resultado({ ...estado, passo, respostas: { ...estado.respostas, ...respostas } }, [mensagem], efeitos);
}

export function estadoInicialBot(dados: Omit<EstadoBot, "passo" | "respostas">): EstadoBot {
  return { ...dados, passo: "INICIO", respostas: {} };
}

export function processarMensagemBot(estado: EstadoBot, entrada: string, configuracao?: PassoBotConfiguravel[]): ResultadoBot {
  const passos = normalizarPassosBot(configuracao);
  const recebida = texto(entrada);
  if (estado.passo === "FINALIZADO") return resultado(estado, []);
  if (pediuPessoa.test(recebida) || perguntouValor.test(recebida)) {
    const motivo = perguntouValor.test(recebida) ? "PERGUNTA_COMERCIAL" : "PEDIDO_ATENDENTE";
    return resultado({ ...estado, passo: "FINALIZADO" }, [
      { texto: "Vou chamar a equipe da academia para continuar com você por aqui." },
    ], [{ tipo: "TRANSFERIR_EQUIPE", motivo }]);
  }
  switch (estado.passo) {
    case "INICIO":
      return avancar(estado, "NOME", {}, { texto: textoDoPasso(passos, "NOME", { academia: estado.academia }) });
    case "NOME":
      if (recebida.length < 2) return resultado(estado, [{ texto: "Como você gostaria de ser chamado?" }]);
      return avancar(estado, "PARA_QUEM", { nome: recebida }, { texto: textoDoPasso(passos, "PARA_QUEM", { nome: recebida }), botoes: ["Para mim", "Para meu filho"] });
    case "PARA_QUEM": {
      const filho = /filh|crian|dependente/.test(opcao(recebida));
      const proprio = /mim|eu|próprio|proprio/.test(opcao(recebida));
      if (!filho && !proprio) return resultado(estado, [{ texto: "Escolha uma opção para continuarmos.", botoes: ["Para mim", "Para meu filho"] }]);
      if (filho) return avancar(estado, "PRATICANTE_NOME", { tipoContato: "RESPONSAVEL" }, { texto: "Qual é o nome do praticante?" });
      return avancar(estado, "SITUACAO", { tipoContato: "PRATICANTE" }, { texto: textoDoPasso(passos, "SITUACAO"), botoes: ["Nunca treinei", "Treino em outra academia", "Já treinei aqui e quero voltar"] });
    }
    case "PRATICANTE_NOME":
      if (recebida.length < 2) return resultado(estado, [{ texto: "Informe o nome do praticante." }]);
      return avancar(estado, "PRATICANTE_NASCIMENTO", { praticanteNome: recebida }, { texto: "Qual é a data de nascimento do praticante? Use DD/MM/AAAA." });
    case "PRATICANTE_NASCIMENTO": {
      const partes = recebida.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (!partes) return resultado(estado, [{ texto: "Informe a data no formato DD/MM/AAAA." }]);
      const data = new Date(`${partes[3]}-${partes[2]}-${partes[1]}T00:00:00.000Z`);
      if (Number.isNaN(data.getTime()) || data > new Date()) return resultado(estado, [{ texto: "Informe uma data de nascimento válida." }]);
      return avancar(estado, "SITUACAO", { praticanteNascimento: data.toISOString() }, { texto: "Qual destas opções descreve melhor a situação atual?", botoes: ["Nunca treinou", "Treina em outra academia", "Já treinou aqui e quer voltar"] });
    }
    case "SITUACAO": {
      const valor = opcao(recebida);
      const situacao = /outra/.test(valor) ? "TREINA_EM_OUTRA" : /volt|aqui|ex/.test(valor) ? "EX_ALUNO" : /nunca/.test(valor) ? "NUNCA_TREINOU" : null;
      if (!situacao) return resultado(estado, [{ texto: "Escolha uma das opções apresentadas.", botoes: ["Nunca treinei", "Treino em outra academia", "Já treinei aqui e quero voltar"] }]);
      return avancar(estado, "TURNO", { situacao }, { texto: textoDoPasso(passos, "TURNO"), botoes: ["Manhã", "Tarde", "Noite"] });
    }
    case "TURNO": {
      const turno = opcao(recebida);
      if (!/^(manhã|manha|tarde|noite)$/.test(turno)) return resultado(estado, [{ texto: "Escolha manhã, tarde ou noite.", botoes: ["Manhã", "Tarde", "Noite"] }]);
      const respostas = { turnoPreferido: turno === "manha" ? "MANHÃ" : turno.toUpperCase() };
      if (estado.canal === "INSTAGRAM") return avancar(estado, "TELEFONE_INSTAGRAM", respostas, { texto: textoDoPasso(passos, "TELEFONE_INSTAGRAM") });
      return avancar(estado, "CONSENTIMENTO", { ...respostas, telefoneE164: normalizarTelefoneBR(estado.contatoExternoId) ?? "" }, { texto: `${TEXTO_CONSENTIMENTO_DADOS}\n\n${textoDoPasso(passos, "CONSENTIMENTO")}`, botoes: ["Sim, autorizo", "Prefiro não"] });
    }
    case "TELEFONE_INSTAGRAM": {
      const telefoneE164 = normalizarTelefoneBR(recebida);
      if (!telefoneE164) return resultado(estado, [{ texto: "Informe um WhatsApp válido com DDD." }]);
      return avancar(estado, "CONSENTIMENTO", { telefoneE164 }, { texto: `${TEXTO_CONSENTIMENTO_DADOS}\n\n${textoDoPasso(passos, "CONSENTIMENTO")}`, botoes: ["Sim, autorizo", "Prefiro não"] });
    }
    case "CONSENTIMENTO": {
      const aceitou = /^(sim|sim, autorizo|autorizo)$/.test(opcao(recebida));
      if (!aceitou && !/não|nao|prefiro/.test(opcao(recebida))) return resultado(estado, [{ texto: "Escolha uma opção.", botoes: ["Sim, autorizo", "Prefiro não"] }]);
      if (!aceitou) return resultado({ ...estado, passo: "FINALIZADO", respostas: { ...estado.respostas, consentimento: false } }, [
        { texto: "Tudo bem. Não criaremos seu cadastro. Quando quiser, estaremos por aqui." },
      ], [{ tipo: "REGISTRAR_RECUSA_CONSENTIMENTO" }]);
      return resultado({ ...estado, passo: "FINALIZADO", respostas: {
        ...estado.respostas, consentimento: true, consentimentoTexto: TEXTO_CONSENTIMENTO_DADOS, consentimentoVersao: VERSAO_CONSENTIMENTO_LEAD,
      } }, [{ texto: textoDoPasso(passos, "TRANSFERENCIA") }], [{ tipo: "CRIAR_LEAD" }, { tipo: "TRANSFERIR_EQUIPE", motivo: "FLUXO_CONCLUIDO" }]);
  }
}
}
