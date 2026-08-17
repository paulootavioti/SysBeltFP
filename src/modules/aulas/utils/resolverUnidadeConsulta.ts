// ADMIN e PROFESSOR podem consultar (só leitura) a grade de outra unidade
// pra efeito informativo, sem que isso mude o escopo deles em nenhuma outra
// rota — diferente do "ver como" do SUPERADMIN (X-Unidade-Id), que troca o
// escopo da requisição inteira. RECEPCAO e demais perfis ignoram o parâmetro.
const PERFIS_COM_CONSULTA_CROSS_UNIT = ["ADMIN", "PROFESSOR"];

export function resolverUnidadeConsulta(
  perfil: string,
  unidadeIdUsuario: number | null,
  unidadeConsultaIdBruto: unknown
): number | null {
  if (!unidadeConsultaIdBruto || !PERFIS_COM_CONSULTA_CROSS_UNIT.includes(perfil)) {
    return unidadeIdUsuario;
  }

  const id = Number(unidadeConsultaIdBruto);

  if (!Number.isInteger(id) || id <= 0) {
    return unidadeIdUsuario;
  }

  return id;
}
