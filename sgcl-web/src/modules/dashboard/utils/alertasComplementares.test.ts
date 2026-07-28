import { describe, expect, it } from "vitest";

import { mesclarAlertas } from "./alertasComplementares";
import type { AlertaDashboard } from "../types";
import type { MetaDashboard } from "../../metas/types";
import type { Evento } from "../../eventos/types";

function meta(overrides: Partial<MetaDashboard>): MetaDashboard {
  return {
    id: 1,
    nome: "Meta X",
    tipo: "RECEITA",
    valorAtual: 0,
    valorMeta: 100,
    percentualAtingido: 0,
    unidade: "MOEDA",
    status: "EM_ANDAMENTO",
    dataLimite: new Date().toISOString(),
    ...overrides,
  };
}

function evento(overrides: Partial<Evento>): Evento {
  return {
    id: 1,
    unidadeId: 1,
    titulo: "Evento X",
    tipo: "SEMINARIO",
    status: "AGENDADO",
    dataInicio: new Date().toISOString(),
    ...overrides,
  };
}

describe("mesclarAlertas", () => {
  it("inclui um alerta de metas atrasadas quando existe meta com status ATRASADA", () => {
    const alertas = mesclarAlertas([], [meta({ status: "ATRASADA" })], []);
    expect(alertas.some((a) => a.id === "metas-atrasadas")).toBe(true);
  });

  it("não inclui alerta de metas quando nenhuma está atrasada", () => {
    const alertas = mesclarAlertas([], [meta({ status: "EM_ANDAMENTO" })], []);
    expect(alertas.some((a) => a.id === "metas-atrasadas")).toBe(false);
  });

  it("inclui alerta de evento próximo com inscrições abaixo de 50% da meta", () => {
    const daqui3Dias = new Date();
    daqui3Dias.setDate(daqui3Dias.getDate() + 3);

    const alertas = mesclarAlertas(
      [],
      [],
      [evento({ dataInicio: daqui3Dias.toISOString(), metaParticipantes: 40, participantesConfirmados: 5 })]
    );

    expect(alertas.some((a) => a.id === "eventos-inscricoes-baixas")).toBe(true);
  });

  it("não inclui alerta de evento distante (fora da janela de 7 dias)", () => {
    const daqui30Dias = new Date();
    daqui30Dias.setDate(daqui30Dias.getDate() + 30);

    const alertas = mesclarAlertas(
      [],
      [],
      [evento({ dataInicio: daqui30Dias.toISOString(), metaParticipantes: 40, participantesConfirmados: 5 })]
    );

    expect(alertas.some((a) => a.id === "eventos-inscricoes-baixas")).toBe(false);
  });

  it("ordena todos os alertas (backend + derivados) por prioridade", () => {
    const alertaBackendBaixa: AlertaDashboard = {
      id: "backend-baixa",
      titulo: "Baixa",
      descricao: "",
      prioridade: "BAIXA",
    };

    const alertas = mesclarAlertas([alertaBackendBaixa], [meta({ status: "ATRASADA" })], []);
    expect(alertas[0].prioridade).toBe("ALTA");
    expect(alertas[alertas.length - 1].prioridade).toBe("BAIXA");
  });
});
