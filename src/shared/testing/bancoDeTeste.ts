// Trava de segurança da suíte de testes.
//
// Os testes de integração criam e APAGAM registros de verdade. Rodá-los
// contra o banco que a academia usa é questão de tempo até um filtro
// escrito errado apagar dado real — e, mesmo dando certo, cada `await`
// vira uma viagem de rede até o servidor remoto, o que deixa a suíte
// lenta e instável.
//
// Por isso a suíte só roda contra um banco que se reconheça como de
// teste. Falha fechado: na dúvida, aborta em vez de tocar no banco.

export interface AvaliacaoBanco {
  seguro: boolean;
  motivo: string;
}

const HOSTS_LOCAIS = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0", "host.docker.internal"]);

export function avaliarBancoDeTeste(url: string | undefined): AvaliacaoBanco {
  if (!url) {
    return { seguro: false, motivo: "DATABASE_URL não está definida." };
  }

  let endereco: URL;

  try {
    endereco = new URL(url);
  } catch {
    return { seguro: false, motivo: "DATABASE_URL não é uma URL válida." };
  }

  const host = endereco.hostname;
  const nomeBanco = endereco.pathname.replace(/^\//, "");

  // Banco na própria máquina: não é o da academia, pode apagar à vontade.
  if (HOSTS_LOCAIS.has(host)) {
    return { seguro: true, motivo: `banco local (${host}/${nomeBanco})` };
  }

  // Banco remoto só passa se o NOME o identificar como de teste — assim
  // um Postgres de CI ou um branch de teste do Neon continuam válidos.
  if (/(^|[_-])test(e|ing)?([_-]|$)/i.test(nomeBanco)) {
    return { seguro: true, motivo: `banco remoto identificado como de teste (${nomeBanco})` };
  }

  return {
    seguro: false,
    motivo:
      `o banco "${nomeBanco}" em ${host} não parece ser de teste. ` +
      "A suíte apaga registros — rodar aqui pode destruir dado real.",
  };
}

/**
 * Chamado no setup do vitest. Interrompe a suíte antes de qualquer
 * conexão quando o banco configurado não é de teste.
 */
export function exigirBancoDeTeste(
  env: NodeJS.ProcessEnv = process.env
): AvaliacaoBanco {
  const avaliacao = avaliarBancoDeTeste(env.DATABASE_URL);

  if (avaliacao.seguro) return avaliacao;

  // Escape hatch consciente: quem realmente precisa (investigar um bug
  // que só acontece em produção) declara isso explicitamente.
  if (env.PERMITIR_TESTE_EM_BANCO_REAL === "1") {
    console.warn(
      "\n[testes] ATENÇÃO: rodando contra um banco que não é de teste, " +
        "porque PERMITIR_TESTE_EM_BANCO_REAL=1.\n" +
        `[testes] ${avaliacao.motivo}\n`
    );

    return { seguro: true, motivo: "liberado explicitamente por variável de ambiente" };
  }

  throw new Error(
    [
      "",
      "A suíte foi interrompida antes de conectar ao banco.",
      "",
      `Motivo: ${avaliacao.motivo}`,
      "",
      "Crie um .env.test apontando pra um banco local (veja .env.test.example)",
      "e rode `npm run test:db:preparar` uma vez. Depois `npm test` usa ele",
      "sozinho, sem tocar no banco de produção.",
      "",
      "Se você REALMENTE quer rodar contra este banco, use:",
      "  PERMITIR_TESTE_EM_BANCO_REAL=1 npm test",
      "",
    ].join("\n")
  );
}
