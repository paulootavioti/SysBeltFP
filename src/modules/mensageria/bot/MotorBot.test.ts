import { describe, expect, it } from "vitest";
import { estadoInicialBot, processarMensagemBot } from "./MotorBot";
import { PASSOS_PADRAO } from "./fluxoBot";

function executar(canal: "WHATSAPP" | "INSTAGRAM", entradas: string[]) {
  let estado = estadoInicialBot({ canal, academia: "Dojo Central", contatoExternoId: canal === "WHATSAPP" ? "5511999990000" : "igsid-1" });
  let ultimo = processarMensagemBot(estado, entradas[0] ?? "oi"); estado = ultimo.estado;
  for (const entrada of entradas.slice(1)) { ultimo = processarMensagemBot(estado, entrada); estado = ultimo.estado; }
  return ultimo;
}

describe("máquina de estados do bot", () => {
  it("conclui o fluxo WhatsApp e produz os efeitos de lead e transferência", () => {
    const resultado = executar("WHATSAPP", ["oi", "Maria", "Para mim", "Nunca treinei", "Noite", "Sim, autorizo"]);
    expect(resultado.estado.passo).toBe("FINALIZADO");
    expect(resultado.estado.respostas).toMatchObject({ nome: "Maria", tipoContato: "PRATICANTE", situacao: "NUNCA_TREINOU", turnoPreferido: "NOITE", telefoneE164: "5511999990000", consentimento: true });
    expect(resultado.efeitos.map(({ tipo }) => tipo)).toEqual(["CRIAR_LEAD", "TRANSFERIR_EQUIPE"]);
  });

  it("coleta WhatsApp no Instagram antes do consentimento", () => {
    const resultado = executar("INSTAGRAM", ["oi", "João", "Para mim", "Treino em outra academia", "Tarde", "(11) 98888-7777", "Sim"]);
    expect(resultado.estado.respostas).toMatchObject({ telefoneE164: "5511988887777", consentimento: true });
  });

  it("registra recusa e não cria lead", () => {
    const resultado = executar("WHATSAPP", ["oi", "Ana", "Para mim", "Nunca treinei", "Manhã", "Prefiro não"]);
    expect(resultado.efeitos).toEqual([{ tipo: "REGISTRAR_RECUSA_CONSENTIMENTO" }]);
    expect(resultado.efeitos).not.toContainEqual({ tipo: "CRIAR_LEAD" });
  });

  it.each(["Quero falar com uma pessoa", "Qual o preço e desconto?"])("transfere imediatamente no escape: %s", (entrada) => {
    const inicial = estadoInicialBot({ canal: "WHATSAPP", academia: "Dojo", contatoExternoId: "5511999990000" });
    const resultado = processarMensagemBot(inicial, entrada);
    expect(resultado.estado.passo).toBe("FINALIZADO");
    expect(resultado.efeitos[0]).toMatchObject({ tipo: "TRANSFERIR_EQUIPE" });
    expect(resultado.efeitos).not.toContainEqual({ tipo: "CRIAR_LEAD" });
  });

  it("usa o texto publicado sem alterar as regras do fluxo", () => {
    const inicial = estadoInicialBot({ canal: "WHATSAPP", academia: "Dojo Central", contatoExternoId: "5511999990000" });
    const passos = PASSOS_PADRAO.map((passo) => passo.id === "NOME" ? { ...passo, texto: "Boas-vindas à {academia}. Qual é o seu nome?" } : passo);
    const resultado = processarMensagemBot(inicial, "oi", passos);
    expect(resultado.mensagens[0].texto).toBe("Boas-vindas à Dojo Central. Qual é o seu nome?");
    expect(resultado.estado.passo).toBe("NOME");
  });
});
