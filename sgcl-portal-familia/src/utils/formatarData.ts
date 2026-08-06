// Há dois tipos de data no sistema, e confundi-los desloca o valor
// mostrado em até um dia:
//
// 1. DATA DE CALENDÁRIO — vencimento, nascimento, data da aula, graduação.
//    Não é um instante: é um dia. O backend guarda ancorada na meia-noite
//    UTC, então formatar no fuso do navegador (Brasília, UTC-3) mostraria
//    o dia anterior.
//
// 2. INSTANTE REAL — os campos `@default(now())`: createdAt de mensagem,
//    criadoEm de pedido, dataPagamento. Aconteceram num momento absoluto,
//    e devem aparecer no relógio de quem está olhando.
//
// A regra prática: se o valor veio de um campo que o usuário preencheu
// num calendário, use `formatarData`. Se foi o servidor que carimbou,
// use `formatarDataHora`.

type Entrada = string | number | Date;

function paraData(valor: Entrada): Date {
  return valor instanceof Date ? valor : new Date(valor);
}

/** Data de calendário (dd/mm/aaaa) — imune ao fuso de quem está olhando. */
export function formatarData(valor: Entrada): string {
  return paraData(valor).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

/** Data de calendário por extenso, ex.: "segunda-feira, 10 de agosto". */
export function formatarDataExtenso(
  valor: Entrada,
  opcoes: Intl.DateTimeFormatOptions = { weekday: "long", day: "2-digit", month: "long" }
): string {
  return paraData(valor).toLocaleDateString("pt-BR", { ...opcoes, timeZone: "UTC" });
}

/**
 * Dia e horário de uma aula. O horário é relógio de parede da academia
 * (19h é 19h no tatame), então também não se converte — senão o professor
 * programa 18:00 e a grade mostra 15:00.
 */
export function formatarDataHoraAula(valor: Entrada): string {
  return paraData(valor).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "UTC",
  });
}

/** Só o horário da aula (HH:mm), mesma regra de relógio de parede. */
export function formatarHoraAula(valor: Entrada): string {
  return paraData(valor).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

/** Instante real (carimbo do servidor) — mostrado no fuso do usuário. */
export function formatarDataHora(valor: Entrada): string {
  return paraData(valor).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}
