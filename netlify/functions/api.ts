import serverless from "serverless-http";
import { app } from "../../src/app";
import { descarregarMonitoramento } from "../../src/shared/observability/monitoramento";

const atender = serverless(app, {
  basePath: "/api",
  // Sem isso, serverless-http força a resposta inteira (inclusive binários)
  // para UTF-8 antes de repassar pro Lambda, corrompendo os bytes da imagem.
  binary: ["image/jpeg", "image/png", "image/webp", "image/gif"],
});

export const handler = async (...argumentos: Parameters<typeof atender>) => {
  try {
    return await atender(...argumentos);
  } finally {
    // A function pode ser congelada assim que responde: espera o envio dos
    // erros ao Sentry. Sem SENTRY_DSN, não espera nada.
    await descarregarMonitoramento();
  }
};
