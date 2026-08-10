import { describe, expect, it } from "vitest";

import { cifrar } from "../../../shared/security/segredos";
import {
  lerCredenciaisGateway,
  nomeDoGateway,
  prepararConfiguracaoParaGravar,
  resumirConfiguracao,
} from "./credenciais";
import { obterGateway } from "./index";

const ENV = { CHAVE_SEGREDOS: "c".repeat(64) } as NodeJS.ProcessEnv;

const TOKEN_ALFA = "APP_USR-token-da-academia-alfa";
const TOKEN_BETA = "APP_USR-token-da-academia-beta";

function configuracaoCom(token: string, segredo = "segredo-webhook") {
  return prepararConfiguracaoParaGravar(
    { gateway: "MERCADO_PAGO", credenciais: { accessToken: token, webhookSecret: segredo } },
    null,
    ENV
  );
}

describe("credenciais nascem cifradas", () => {
  it("o token não fica em texto puro no que vai pro banco", () => {
    const configuracao = configuracaoCom(TOKEN_ALFA);

    expect(JSON.stringify(configuracao)).not.toContain(TOKEN_ALFA);
    expect(configuracao.credenciais?.accessToken).toMatch(/^enc:v1:/);
    expect(configuracao.credenciais?.webhookSecret).toMatch(/^enc:v1:/);
  });

  it("e voltam decifradas na hora do uso", () => {
    const credenciais = lerCredenciaisGateway(configuracaoCom(TOKEN_ALFA), ENV);

    expect(credenciais.accessToken).toBe(TOKEN_ALFA);
    expect(credenciais.webhookSecret).toBe("segredo-webhook");
  });
});

describe("cada assinante usa a própria conta", () => {
  it("configurações diferentes devolvem credenciais diferentes", () => {
    const alfa = lerCredenciaisGateway(configuracaoCom(TOKEN_ALFA), ENV);
    const beta = lerCredenciaisGateway(configuracaoCom(TOKEN_BETA), ENV);

    expect(alfa.accessToken).toBe(TOKEN_ALFA);
    expect(beta.accessToken).toBe(TOKEN_BETA);
  });

  it("credencial da unidade tem precedência sobre a variável de ambiente", () => {
    // o ambiente ainda tem a credencial da instalação antiga; a unidade
    // que já cadastrou a sua não pode cobrar na conta do ambiente.
    const envComLegado = {
      ...ENV,
      MERCADO_PAGO_ACCESS_TOKEN: "token-do-ambiente",
      MERCADO_PAGO_WEBHOOK_SECRET: "segredo-do-ambiente",
    } as NodeJS.ProcessEnv;

    const credenciais = lerCredenciaisGateway(configuracaoCom(TOKEN_ALFA), envComLegado);

    expect(credenciais.accessToken).toBe(TOKEN_ALFA);
  });

  it("sem credencial na unidade, cai no ambiente (instalação de uma academia só)", () => {
    const envComLegado = {
      ...ENV,
      MERCADO_PAGO_ACCESS_TOKEN: "token-do-ambiente",
      MERCADO_PAGO_WEBHOOK_SECRET: "segredo-do-ambiente",
      NODE_ENV: "test",
    } as NodeJS.ProcessEnv;

    expect(lerCredenciaisGateway(null, envComLegado).accessToken).toBe("token-do-ambiente");
  });

  it("sem credencial em lugar nenhum, devolve vazio em vez de inventar", () => {
    const credenciais = lerCredenciaisGateway(null, { ...ENV, NODE_ENV: "test" } as NodeJS.ProcessEnv);

    expect(credenciais.accessToken).toBe("");
    expect(credenciais.webhookSecret).toBe("");
  });
});

describe("editar sem reenviar a credencial", () => {
  it("mantém o token quando o formulário não o manda de volta", () => {
    // a tela nunca recebe a credencial, então também não a devolve ao
    // salvar. Se isso apagasse o token, trocar o nome da forma de
    // pagamento derrubaria a cobrança do cliente.
    const atual = configuracaoCom(TOKEN_ALFA);

    const depois = prepararConfiguracaoParaGravar({ gateway: "MERCADO_PAGO" }, atual, ENV);

    expect(lerCredenciaisGateway(depois, ENV).accessToken).toBe(TOKEN_ALFA);
  });

  it("string vazia remove a credencial de propósito", () => {
    const atual = configuracaoCom(TOKEN_ALFA);

    const depois = prepararConfiguracaoParaGravar(
      { gateway: "MERCADO_PAGO", credenciais: { accessToken: "" } },
      atual,
      ENV
    );

    expect(depois.credenciais?.accessToken).toBeUndefined();
    // o segredo de webhook, que não foi tocado, continua lá.
    expect(depois.credenciais?.webhookSecret).toMatch(/^enc:v1:/);
  });

  it("não cifra duas vezes ao reeditar", () => {
    const atual = configuracaoCom(TOKEN_ALFA);
    const umaVez = prepararConfiguracaoParaGravar(atual, atual, ENV);
    const duasVezes = prepararConfiguracaoParaGravar(umaVez, umaVez, ENV);

    expect(lerCredenciaisGateway(duasVezes, ENV).accessToken).toBe(TOKEN_ALFA);
  });

  it("troca o token quando um novo é informado", () => {
    const atual = configuracaoCom(TOKEN_ALFA);

    const depois = prepararConfiguracaoParaGravar(
      { gateway: "MERCADO_PAGO", credenciais: { accessToken: TOKEN_BETA } },
      atual,
      ENV
    );

    expect(lerCredenciaisGateway(depois, ENV).accessToken).toBe(TOKEN_BETA);
  });
});

describe("resumo que pode sair na API", () => {
  it("diz o gateway e o que está preenchido, sem revelar valor", () => {
    const resumo = resumirConfiguracao(configuracaoCom(TOKEN_ALFA));

    expect(resumo).toEqual({
      gateway: "MERCADO_PAGO",
      credenciaisConfiguradas: { accessToken: true, webhookSecret: true },
    });
    expect(JSON.stringify(resumo)).not.toContain(TOKEN_ALFA);
    expect(JSON.stringify(resumo)).not.toContain("enc:v1");
  });

  it("forma de pagamento manual não inventa gateway", () => {
    expect(resumirConfiguracao(null)).toEqual({
      gateway: null,
      credenciaisConfiguradas: { accessToken: false, webhookSecret: false },
    });
  });

  it("aponta credencial faltando, que é o que a tela precisa avisar", () => {
    const sohToken = prepararConfiguracaoParaGravar(
      { gateway: "MERCADO_PAGO", credenciais: { accessToken: TOKEN_ALFA } },
      null,
      ENV
    );

    expect(resumirConfiguracao(sohToken).credenciaisConfiguradas).toEqual({
      accessToken: true,
      webhookSecret: false,
    });
  });
});

describe("escolha do gateway", () => {
  it("lê o nome da configuração", () => {
    expect(nomeDoGateway({ gateway: "MERCADO_PAGO" })).toBe("MERCADO_PAGO");
    expect(nomeDoGateway(null)).toBeNull();
    expect(nomeDoGateway({})).toBeNull();
  });

  it("sem gateway configurado, usa o manual (baixa na mão)", () => {
    expect(obterGateway("DINHEIRO", null).nome).toBe("Manual");
    expect(obterGateway("PIX", {}).nome).toBe("Manual");
  });

  it("gateway desconhecido cai no manual em vez de quebrar", () => {
    expect(obterGateway("PIX", { gateway: "GATEWAY_QUE_NAO_EXISTE" }).nome).toBe("Manual");
  });

  it("com gateway configurado, devolve o gateway do cliente", () => {
    expect(obterGateway("PIX", { gateway: "MERCADO_PAGO" }).nome).toBe("Mercado Pago");
  });
});
