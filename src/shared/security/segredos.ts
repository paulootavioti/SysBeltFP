import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// Cofre dos segredos que ficam no banco.
//
// Credencial de gateway (access token do Mercado Pago, segredo de webhook)
// é senha de movimentar dinheiro do cliente. Guardar em texto puro numa
// coluna Json significa que qualquer dump do banco, backup vazado ou log
// de consulta entrega a chave da conta de todos os assinantes de uma vez.
//
// AES-256-GCM, e não AES-CBC: o GCM autentica o texto cifrado, então
// adulterar um byte no banco faz a decifragem FALHAR em vez de devolver
// lixo silenciosamente.
//
// A chave mora em CHAVE_SEGREDOS, fora do banco — é o que faz o dump do
// banco, sozinho, não valer nada. Gere a sua com:
//
//   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

const PREFIXO = "enc:v1";
const TAMANHO_IV = 12; // 96 bits, o recomendado pra GCM
const TAMANHO_CHAVE = 32; // AES-256

export class SegredoNaoConfiguradoError extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "SegredoNaoConfiguradoError";
  }
}

function obterChave(env: NodeJS.ProcessEnv = process.env): Buffer {
  const bruta = env.CHAVE_SEGREDOS;

  if (!bruta) {
    // Falha fechado: sem chave configurada o sistema se recusa a guardar
    // credencial, em vez de gravar em texto puro "por enquanto".
    throw new SegredoNaoConfiguradoError(
      "CHAVE_SEGREDOS não configurada — sem ela não é possível guardar credenciais com segurança. " +
        "Gere uma com: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }

  const chave = Buffer.from(bruta, "hex");

  if (chave.length !== TAMANHO_CHAVE) {
    throw new SegredoNaoConfiguradoError(
      `CHAVE_SEGREDOS precisa ter ${TAMANHO_CHAVE} bytes em hexadecimal (${TAMANHO_CHAVE * 2} caracteres).`
    );
  }

  return chave;
}

/** Já está cifrado? Serve pra não cifrar duas vezes ao reeditar um cadastro. */
export function estaCifrado(valor: unknown): boolean {
  return typeof valor === "string" && valor.startsWith(`${PREFIXO}:`);
}

export function cifrar(textoPuro: string, env: NodeJS.ProcessEnv = process.env): string {
  const chave = obterChave(env);
  const iv = randomBytes(TAMANHO_IV);

  const cifrador = createCipheriv("aes-256-gcm", chave, iv);
  const cifrado = Buffer.concat([cifrador.update(textoPuro, "utf8"), cifrador.final()]);
  const etiqueta = cifrador.getAuthTag();

  return [
    PREFIXO,
    iv.toString("base64"),
    etiqueta.toString("base64"),
    cifrado.toString("base64"),
  ].join(":");
}

export function decifrar(pacote: string, env: NodeJS.ProcessEnv = process.env): string {
  if (!estaCifrado(pacote)) {
    throw new Error("Valor não está no formato cifrado esperado.");
  }

  const partes = pacote.split(":");

  if (partes.length !== 5) {
    throw new Error("Pacote cifrado malformado.");
  }

  const [, , ivB64, etiquetaB64, cifradoB64] = partes;
  const chave = obterChave(env);

  const decifrador = createDecipheriv("aes-256-gcm", chave, Buffer.from(ivB64, "base64"));
  decifrador.setAuthTag(Buffer.from(etiquetaB64, "base64"));

  // Se o texto cifrado ou a etiqueta foram alterados, `final()` estoura
  // aqui — é a autenticação do GCM fazendo seu trabalho.
  return Buffer.concat([decifrador.update(Buffer.from(cifradoB64, "base64")), decifrador.final()]).toString(
    "utf8"
  );
}

/**
 * Cifra um valor que veio do formulário, a menos que ele já esteja
 * cifrado — o caso de reeditar um cadastro sem mexer na credencial.
 */
export function cifrarSeNecessario(valor: string, env: NodeJS.ProcessEnv = process.env): string {
  return estaCifrado(valor) ? valor : cifrar(valor, env);
}
