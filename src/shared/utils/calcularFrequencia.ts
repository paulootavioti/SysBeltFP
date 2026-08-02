interface RegistroPresenca {
  presente: boolean;
  data: Date | string;
}

export interface FrequenciaPorPeriodo {
  frequenciaMes: number;
  frequenciaAno: number;
}

function calcularPercentual(registros: RegistroPresenca[]): number {
  if (registros.length === 0) return 0;

  const presentes = registros.filter((registro) => registro.presente).length;
  return Math.round((presentes / registros.length) * 100);
}

// frequência (% de presença) do mês e do ano corrente, a partir dos
// registros de presença já carregados (AulaAluno) — reaproveitado no
// prontuário, na ficha do aluno e na média da turma.
export function calcularFrequenciaPorPeriodo(
  registros: RegistroPresenca[],
  referencia: Date = new Date()
): FrequenciaPorPeriodo {
  const mesAtual = referencia.getMonth();
  const anoAtual = referencia.getFullYear();

  const doAno = registros.filter((registro) => new Date(registro.data).getFullYear() === anoAtual);
  const doMes = doAno.filter((registro) => new Date(registro.data).getMonth() === mesAtual);

  return {
    frequenciaMes: calcularPercentual(doMes),
    frequenciaAno: calcularPercentual(doAno),
  };
}
