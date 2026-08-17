import { AppError } from "../errors/AppError";

// SUPERADMIN (unidadeId nulo) enxerga tudo; qualquer outro perfil só vê o
// que pertence à própria unidade. Usar em todo `where` de listagem/busca
// nas tabelas que têm unidadeId direto.
export function escopoUnidade(unidadeId: number | null): { unidadeId: number } {
  return { unidadeId: unidadeId ?? -1 };
}

// Pra buscas por id (que não passam por where/unidadeId na query): garante
// que o registro encontrado pertence à unidade de quem pediu, antes de
// devolver/alterar. Erro genérico de "não encontrado" — não revela que o
// registro existe em outra unidade.
export function garantirAcessoUnidade(
  unidadeIdUsuario: number | null,
  unidadeIdRegistro: number | null,
  mensagem = "Registro não encontrado."
) {
  // superadmin (unidadeIdUsuario nulo) sempre passa. Qualquer outro perfil
  // só acessa registros da própria unidade — inclusive negando acesso a um
  // registro que também não tem unidade (ex.: outra conta SUPERADMIN).
  if (unidadeIdUsuario === null || unidadeIdUsuario !== unidadeIdRegistro) {
    throw new AppError(mensagem);
  }
}
