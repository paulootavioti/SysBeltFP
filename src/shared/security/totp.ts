import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const ALFABETO_BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function codificarBase32(valor: Buffer): string {
  let bits = "";
  for (const byte of valor) bits += byte.toString(2).padStart(8, "0");

  let resultado = "";
  for (let i = 0; i < bits.length; i += 5) {
    resultado += ALFABETO_BASE32[parseInt(bits.slice(i, i + 5).padEnd(5, "0"), 2)];
  }
  return resultado;
}

function decodificarBase32(valor: string): Buffer {
  const normalizado = valor.toUpperCase().replace(/=|\s|-/g, "");
  let bits = "";
  for (const caractere of normalizado) {
    const indice = ALFABETO_BASE32.indexOf(caractere);
    if (indice < 0) throw new Error("Segredo TOTP inválido.");
    bits += indice.toString(2).padStart(5, "0");
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

export function gerarSegredoTotp(): string {
  return codificarBase32(randomBytes(20));
}

export function gerarCodigoTotp(
  segredo: string,
  instanteMs = Date.now(),
  digitos = 6,
  periodoSegundos = 30,
): string {
  const contador = Math.floor(instanteMs / 1000 / periodoSegundos);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(contador));
  const hash = createHmac("sha1", decodificarBase32(segredo)).update(buffer).digest();
  const deslocamento = hash[hash.length - 1] & 0x0f;
  const numero = (hash.readUInt32BE(deslocamento) & 0x7fffffff) % 10 ** digitos;
  return String(numero).padStart(digitos, "0");
}

export function verificarCodigoTotp(
  segredo: string,
  codigo: string,
  instanteMs = Date.now(),
  janela = 1,
): boolean {
  if (!/^\d{6}$/.test(codigo)) return false;
  const recebido = Buffer.from(codigo);
  for (let deslocamento = -janela; deslocamento <= janela; deslocamento += 1) {
    const esperado = Buffer.from(gerarCodigoTotp(segredo, instanteMs + deslocamento * 30_000));
    if (esperado.length === recebido.length && timingSafeEqual(esperado, recebido)) return true;
  }
  return false;
}

export function criarUriTotp(segredo: string, email: string, emissor = "Sys Belt"): string {
  const rotulo = encodeURIComponent(`${emissor}:${email}`);
  return `otpauth://totp/${rotulo}?secret=${segredo}&issuer=${encodeURIComponent(emissor)}&algorithm=SHA1&digits=6&period=30`;
}
