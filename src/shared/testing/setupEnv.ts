import { existsSync } from "fs";
import { resolve } from "path";

import { config } from "dotenv";

import { exigirBancoDeTeste } from "./bancoDeTeste";

// A suíte usa .env.test quando ele existe, com prioridade sobre o .env —
// senão herdaria o DATABASE_URL de produção e os testes, que apagam
// registros, rodariam contra o banco da academia.
const arquivoDeTeste = resolve(process.cwd(), ".env.test");

if (existsSync(arquivoDeTeste)) {
  config({ path: arquivoDeTeste, override: true });
} else {
  config();
}

// Antes de qualquer conexão: confirma que o banco configurado é de teste.
exigirBancoDeTeste();
