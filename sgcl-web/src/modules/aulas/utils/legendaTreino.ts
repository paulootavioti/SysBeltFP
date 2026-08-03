const DIAS_SEMANA_COMPLETO = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

// legenda padrão sugerida ao publicar foto de treino — "Treino 17h00 · Quarta".
// Usa o horário programado da turma (não o instante exato em que a aula foi
// iniciada) e o dia da semana em que a aula efetivamente aconteceu.
export function gerarLegendaTreino(dataAula: string, horarioInicio?: string | null): string {
  const diaSemana = DIAS_SEMANA_COMPLETO[new Date(dataAula).getDay()];
  const horario = horarioInicio ? `${horarioInicio.replace(":", "h")} · ` : "";

  return `Treino ${horario}${diaSemana}`;
}
