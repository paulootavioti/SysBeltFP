import serverless from "serverless-http";
import { app } from "../../src/app";

export const handler = serverless(app, {
  basePath: "/api",
  // Sem isso, serverless-http força a resposta inteira (inclusive binários)
  // para UTF-8 antes de repassar pro Lambda, corrompendo os bytes da imagem.
  binary: ["image/jpeg", "image/png", "image/webp", "image/gif"],
});
