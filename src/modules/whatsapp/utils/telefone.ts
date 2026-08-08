// O WhatsApp exige o número em E.164 sem sinais: 5511987654321.
// No cadastro ele chega de todo jeito: "(11) 98765-4321", "11 98765 4321",
// "+55 11 98765-4321". Mandar como está faz a Meta recusar.

const DDI_BRASIL = "55";

export function normalizarTelefoneBR(bruto: string | null | undefined): string | null {
  if (!bruto) return null;

  let digitos = bruto.replace(/\D/g, "");

  if (!digitos) return null;

  // já veio com DDI
  if (digitos.startsWith(DDI_BRASIL) && (digitos.length === 12 || digitos.length === 13)) {
    return digitos;
  }

  // DDD + número (10 dígitos para fixo antigo, 11 para celular com o 9)
  if (digitos.length === 10 || digitos.length === 11) {
    digitos = DDI_BRASIL + digitos;
    return digitos;
  }

  // Qualquer outro tamanho é cadastro incompleto ou errado. Devolver
  // null é melhor que "consertar" com chute e mandar mensagem da
  // academia pro número de um desconhecido.
  return null;
}
