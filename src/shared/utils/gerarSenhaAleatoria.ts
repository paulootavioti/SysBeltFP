// gera uma senha temporária legível (sem caracteres ambíguos como 0/O, 1/l/I)
// para credenciais do Portal da Família emitidas automaticamente no cadastro.
const CARACTERES = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

export function gerarSenhaAleatoria(tamanho = 8): string {
  let senha = "";

  for (let i = 0; i < tamanho; i++) {
    senha += CARACTERES[Math.floor(Math.random() * CARACTERES.length)];
  }

  return senha;
}
