import type { AulaCurriculoFormData } from "../schema/curriculo.schema";

type BlocoFormulario = NonNullable<AulaCurriculoFormData["blocos"]>[number];

function numeroPositivo(valor: string | undefined, padrao: number) {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0 ? numero : padrao;
}

/** Mantém a mesma regra de duração usada pela fila compilada no backend. */
export function duracaoDoBlocoEmSegundos(bloco: BlocoFormulario) {
  if (bloco.tipo !== "SPARRING") return numeroPositivo(bloco.duracaoMinutos, 1) * 60;

  const rounds = numeroPositivo(bloco.rounds, 1);
  const duracaoRoundSegundos = numeroPositivo(bloco.duracaoRoundMinutos, 1) * 60;
  const descansoSegundos = Math.max(0, Number(bloco.descansoSegundos) || 0);

  return rounds * duracaoRoundSegundos + Math.max(0, rounds - 1) * descansoSegundos;
}

export function duracaoTotalBlocosEmSegundos(blocos: AulaCurriculoFormData["blocos"] = []) {
  return blocos.reduce((total, bloco) => total + duracaoDoBlocoEmSegundos(bloco), 0);
}
