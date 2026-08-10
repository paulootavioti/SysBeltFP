import { describe, expect, it } from "vitest";

import {
  SegredoNaoConfiguradoError,
  cifrar,
  cifrarSeNecessario,
  decifrar,
  estaCifrado,
} from "./segredos";

// 32 bytes em hexadecimal. Chave só deste arquivo — a de produção mora
// em CHAVE_SEGREDOS e nunca entra no Git.
const CHAVE = { CHAVE_SEGREDOS: "a".repeat(64) } as NodeJS.ProcessEnv;
const OUTRA_CHAVE = { CHAVE_SEGREDOS: "b".repeat(64) } as NodeJS.ProcessEnv;

const TOKEN = "APP_USR-1234567890123456-080810-abcdef0123456789abcdef0123456789-123456789";

describe("ida e volta", () => {
  it("devolve exatamente o que foi guardado", () => {
    expect(decifrar(cifrar(TOKEN, CHAVE), CHAVE)).toBe(TOKEN);
  });

  it("preserva acento e caractere especial", () => {
    const original = "segredo com açaí, ção e emoji 🥋";

    expect(decifrar(cifrar(original, CHAVE), CHAVE)).toBe(original);
  });

  it("o texto cifrado não contém o original", () => {
    expect(cifrar(TOKEN, CHAVE)).not.toContain(TOKEN);
    expect(cifrar(TOKEN, CHAVE)).not.toContain("APP_USR");
  });

  it("cifrar o mesmo valor duas vezes dá resultados diferentes", () => {
    // IV aleatório por operação: sem isso, dois clientes com a mesma
    // credencial teriam o mesmo texto cifrado, e dava pra deduzir isso
    // só olhando o banco.
    expect(cifrar(TOKEN, CHAVE)).not.toBe(cifrar(TOKEN, CHAVE));
  });
});

describe("adulteração é detectada, não ignorada", () => {
  it("recusa texto cifrado alterado no banco", () => {
    const pacote = cifrar(TOKEN, CHAVE);
    const partes = pacote.split(":");

    // troca um caractere do corpo cifrado, como faria quem editasse a
    // linha direto no banco.
    const corpo = Buffer.from(partes[4], "base64");
    corpo[0] = corpo[0] ^ 0xff;
    partes[4] = corpo.toString("base64");

    // É isto que o GCM garante: falha em vez de devolver lixo que o
    // sistema mandaria pro gateway como se fosse credencial válida.
    expect(() => decifrar(partes.join(":"), CHAVE)).toThrow();
  });

  it("recusa etiqueta de autenticação alterada", () => {
    const partes = cifrar(TOKEN, CHAVE).split(":");
    const etiqueta = Buffer.from(partes[3], "base64");
    etiqueta[0] = etiqueta[0] ^ 0xff;
    partes[3] = etiqueta.toString("base64");

    expect(() => decifrar(partes.join(":"), CHAVE)).toThrow();
  });

  it("recusa decifrar com a chave errada", () => {
    expect(() => decifrar(cifrar(TOKEN, CHAVE), OUTRA_CHAVE)).toThrow();
  });

  it("recusa pacote malformado em vez de devolver algo", () => {
    expect(() => decifrar("enc:v1:so-isso", CHAVE)).toThrow();
    expect(() => decifrar("texto puro qualquer", CHAVE)).toThrow();
  });
});

describe("falha fechado sem chave", () => {
  it("não cifra quando CHAVE_SEGREDOS está ausente", () => {
    expect(() => cifrar(TOKEN, {} as NodeJS.ProcessEnv)).toThrow(SegredoNaoConfiguradoError);
  });

  it("a mensagem ensina como gerar a chave", () => {
    expect(() => cifrar(TOKEN, {} as NodeJS.ProcessEnv)).toThrow(/randomBytes\(32\)/);
  });

  it("recusa chave de tamanho errado em vez de completar com zeros", () => {
    expect(() => cifrar(TOKEN, { CHAVE_SEGREDOS: "abc" } as NodeJS.ProcessEnv)).toThrow(
      SegredoNaoConfiguradoError
    );
    expect(() =>
      cifrar(TOKEN, { CHAVE_SEGREDOS: "a".repeat(32) } as NodeJS.ProcessEnv)
    ).toThrow(SegredoNaoConfiguradoError);
  });
});

describe("cifrarSeNecessario", () => {
  it("cifra o que veio do formulário", () => {
    const resultado = cifrarSeNecessario(TOKEN, CHAVE);

    expect(estaCifrado(resultado)).toBe(true);
    expect(decifrar(resultado, CHAVE)).toBe(TOKEN);
  });

  it("não cifra de novo o que já está cifrado", () => {
    // reeditar a forma de pagamento sem mexer na credencial não pode
    // empilhar camadas de cifra — a segunda decifragem devolveria o
    // pacote da primeira em vez do token.
    const jaCifrado = cifrar(TOKEN, CHAVE);

    expect(cifrarSeNecessario(jaCifrado, CHAVE)).toBe(jaCifrado);
    expect(decifrar(cifrarSeNecessario(jaCifrado, CHAVE), CHAVE)).toBe(TOKEN);
  });
});
