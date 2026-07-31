import type { Curriculo } from "../types/curriculo";

function normalizar(texto: string) {
  return texto.toLowerCase();
}

// Filtra a árvore currículo → módulo → aula → técnica por um termo de
// busca. Quando o próprio nome de um currículo ou módulo bate com o termo,
// tudo abaixo dele é mostrado sem filtrar (regra pedida: "cujo próprio nome
// bate mostra tudo abaixo sem filtrar").
export function filtrarCurriculosPorBusca(curriculos: Curriculo[], busca: string): Curriculo[] {
  const termo = normalizar(busca.trim());
  if (!termo) return curriculos;

  const resultado: Curriculo[] = [];

  for (const curriculo of curriculos) {
    const curriculoNomeBate = normalizar(curriculo.nome).includes(termo);

    const modulosFiltrados = [];

    for (const modulo of curriculo.modulos) {
      const moduloNomeBate = normalizar(modulo.nome).includes(termo);
      const mostrarTudoDoModulo = curriculoNomeBate || moduloNomeBate;

      const aulasFiltradas = [];

      for (const aula of modulo.aulas) {
        const aulaTituloBate = normalizar(aula.titulo).includes(termo);
        const mostrarTudoDaAula = mostrarTudoDoModulo || aulaTituloBate;

        const tecnicasFiltradas = mostrarTudoDaAula
          ? aula.tecnicas
          : aula.tecnicas.filter((tecnica) => normalizar(tecnica.nome).includes(termo));

        if (mostrarTudoDaAula || tecnicasFiltradas.length > 0) {
          aulasFiltradas.push({ ...aula, tecnicas: tecnicasFiltradas });
        }
      }

      if (mostrarTudoDoModulo || aulasFiltradas.length > 0) {
        modulosFiltrados.push({ ...modulo, aulas: aulasFiltradas });
      }
    }

    if (curriculoNomeBate || modulosFiltrados.length > 0) {
      resultado.push({ ...curriculo, modulos: modulosFiltrados });
    }
  }

  return resultado;
}
