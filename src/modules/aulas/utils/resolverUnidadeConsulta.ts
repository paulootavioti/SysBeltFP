// ADMIN e PROFESSOR podem consultar (só leitura) a grade de outra unidade
// pra efeito informativo, sem que isso mude o escopo deles em nenhuma outra
// rota. RECEPCAO e demais perfis ignoram o parâmetro.
//
// "Outra unidade" é outra unidade DA MESMA CONTA. Sem essa checagem, o
// parâmetro é um id livre na querystring: um ADMIN de uma academia leria a
// grade de outra passando o id da unidade dela.
const PERFIS_COM_CONSULTA_CROSS_UNIT = ["DONO", "ADMIN", "PROFESSOR"];

export function resolverUnidadeConsulta(
  perfil: string,
  unidadeIdUsuario: number | null,
  unidadeConsultaIdBruto: unknown,
  unidadesPermitidas: number[]
): number | null {
  if (!unidadeConsultaIdBruto || !PERFIS_COM_CONSULTA_CROSS_UNIT.includes(perfil)) {
    return unidadeIdUsuario;
  }

  const id = Number(unidadeConsultaIdBruto);

  if (!Number.isInteger(id) || id <= 0) {
    return unidadeIdUsuario;
  }

  // Pedido fora do alcance cai no escopo normal de quem pediu, como qualquer
  // outro parâmetro inválido — não vira erro, e não vira acesso.
  if (!unidadesPermitidas.includes(id)) {
    return unidadeIdUsuario;
  }

  return id;
}
