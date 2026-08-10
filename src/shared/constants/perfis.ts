// Papéis do sistema, e a distinção que passa a importar quando o SysBelt é
// vendido por assinatura:
//
//   SUPERADMIN — o OPERADOR DA PLATAFORMA (você, que vende). Não pertence
//                a nenhuma unidade e enxerga TODOS os assinantes. Nunca
//                deve ser dado a um cliente: é a única credencial que
//                atravessa a fronteira entre contas.
//
//   DONO       — o dono da academia CLIENTE. Alcança todas as filiais da
//                própria conta e nenhuma de outra. É o papel que existe
//                justamente pra ninguém precisar dar SUPERADMIN a um
//                cliente que tem mais de uma unidade.
//
//   ADMIN / RECEPCAO / PROFESSOR — trabalham na(s) unidade(s) a que foram
//                vinculados.
export const PERFIS = ["SUPERADMIN", "DONO", "ADMIN", "PROFESSOR", "RECEPCAO"] as const;

export type Perfil = (typeof PERFIS)[number];

// Perfis que podem estar vinculados a mais de uma unidade e trocar a
// unidade ativa. PROFESSOR entra porque pode dar aula em mais de uma
// unidade; DONO porque alcança todas as filiais da conta. SUPERADMIN fica
// de fora: ele não pertence a unidade nenhuma, transita por todas.
export const PERFIS_MULTI_UNIDADE = ["DONO", "ADMIN", "PROFESSOR", "RECEPCAO"];

// O DONO manda na própria academia: onde um ADMIN passa, ele passa.
// Declarado aqui, num lugar só, pra não depender de cada rota lembrar de
// listar os dois.
export const PERFIS_QUE_HERDAM: Record<string, string[]> = {
  DONO: ["ADMIN"],
};
