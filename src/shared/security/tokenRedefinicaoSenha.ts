import { createHash, randomBytes } from "node:crypto";

export function gerarTokenRedefinicaoSenha() {
  const token = randomBytes(32).toString("hex");
  return { token, tokenHash: hashTokenRedefinicaoSenha(token) };
}

export function hashTokenRedefinicaoSenha(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
