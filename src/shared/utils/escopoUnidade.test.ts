import { describe, expect, it } from "vitest";

import { comContextoRequisicao } from "../context/contextoRequisicao";
import {
  escopoDeUnidadePropria,
  escopoUnidade,
  garantirAcessoUnidade,
} from "./escopoUnidade";

// Um usuário autenticado do assinante Alfa, que tem as unidades 1 e 2.
const comoDono = <T>(acao: () => T) =>
  comContextoRequisicao({ usuarioId: 10, unidadesDoUsuario: [1, 2] }, acao);

// Cron/scripts: rodam sem usuário no contexto.
const comoRotinaInterna = <T>(acao: () => T) => comContextoRequisicao({}, acao);

describe("escopoUnidade", () => {
  it("filtra pela unidade ativa quando existe", () => {
    expect(comoDono(() => escopoUnidade(7))).toEqual({ unidadeId: 7 });
  });

  // RN-164: o DONO alcança as filiais da própria academia. Antes isto era um
  // `where` vazio, que num banco com mais de um assinante entrega os outros.
  it("sem unidade ativa, alcança as unidades da própria conta", () => {
    expect(comoDono(() => escopoUnidade(null))).toEqual({ unidadeId: { in: [1, 2] } });
  });

  // A cobrança recorrente e os lembretes rodam pelo tenant inteiro, sem
  // usuário — é o único caso legítimo de consulta sem filtro.
  it("rotina interna sem usuário varre o tenant", () => {
    expect(comoRotinaInterna(() => escopoUnidade(null))).toEqual({});
  });

  // Fora de requisição não há contexto nenhum: a leitura do contexto devolve
  // campos nulos, e isso precisa cair no caso "rotina", não em erro.
  it("fora de requisição se comporta como rotina interna", () => {
    expect(escopoUnidade(null)).toEqual({});
  });

  // Se o middleware falhar em preencher o alcance de um usuário autenticado,
  // o resultado tem que ser "não vê nada", nunca "vê tudo".
  it("usuário sem alcance preenchido não vira acesso total", () => {
    const escopo = comContextoRequisicao({ usuarioId: 10 }, () => escopoUnidade(null));

    expect(escopo).toEqual({ unidadeId: { in: [] } });
  });
});

describe("escopoDeUnidadePropria", () => {
  it("traduz o mesmo escopo para a chave primária de Unidade", () => {
    expect(comoDono(() => escopoDeUnidadePropria(7))).toEqual({ id: 7 });
    expect(comoDono(() => escopoDeUnidadePropria(null))).toEqual({ id: { in: [1, 2] } });
    expect(comoRotinaInterna(() => escopoDeUnidadePropria(null))).toEqual({});
  });
});

describe("garantirAcessoUnidade", () => {
  it("deixa passar registro da própria unidade", () => {
    expect(() => comoDono(() => garantirAcessoUnidade(1, 1))).not.toThrow();
  });

  it("barra registro de outra unidade", () => {
    expect(() => comoDono(() => garantirAcessoUnidade(1, 2))).toThrow("Registro não encontrado.");
  });

  // Um registro sem unidade não pertence a unidade nenhuma — nem à de quem
  // pergunta, nem à conta de um DONO.
  it("barra registro sem unidade", () => {
    expect(() => comoDono(() => garantirAcessoUnidade(1, null))).toThrow();
    expect(() => comoDono(() => garantirAcessoUnidade(null, null))).toThrow();
  });

  it("sem unidade ativa, alcança a conta e só ela", () => {
    expect(() => comoDono(() => garantirAcessoUnidade(null, 2))).not.toThrow();
    expect(() => comoDono(() => garantirAcessoUnidade(null, 99))).toThrow(
      "Registro não encontrado."
    );
  });

  it("rotina interna alcança qualquer registro", () => {
    expect(() => comoRotinaInterna(() => garantirAcessoUnidade(null, 99))).not.toThrow();
  });

  it("usuário sem alcance preenchido não passa", () => {
    expect(() =>
      comContextoRequisicao({ usuarioId: 10 }, () => garantirAcessoUnidade(null, 1))
    ).toThrow();
  });
});
