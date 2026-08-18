// Os papéis do sistema, do lado da tela. Espelham
// `src/shared/constants/perfis.ts` do backend, que é a autoridade — aqui o
// espelho existe só porque frontend e API são pacotes npm separados e não há
// como importar de um para o outro.
//
// Estar espelhado significa que pode divergir, e já divergiu: quando o DONO
// entrou na lista do backend, a cópia que morava dentro do
// `SeletorUnidadeAtiva` ficou para trás, e o seletor de unidade sumiu da tela
// justamente para o único perfil que precisa dele. O defeito passou pela
// suíte inteira e só apareceu no navegador.
//
// Daí duas decisões: a lista mora num lugar só (este arquivo), e
// `perfis.test.ts` lê o arquivo do backend e falha quando os dois discordam.

export const PERFIS = ["DONO", "ADMIN", "PROFESSOR", "RECEPCAO"] as const;

export type Perfil = (typeof PERFIS)[number];

// Perfis que podem estar vinculados a mais de uma unidade e alternar entre
// elas. PROFESSOR entra porque pode dar aula em mais de uma unidade; DONO
// porque alcança todas as filiais da conta.
//
// Hoje é a lista inteira, mas escrita por extenso de propósito: são conceitos
// diferentes, e um perfil novo que não alterne de unidade entraria em `PERFIS`
// sem entrar aqui. Derivar um do outro esconderia essa distinção.
export const PERFIS_MULTI_UNIDADE: readonly string[] = [
  "DONO",
  "ADMIN",
  "PROFESSOR",
  "RECEPCAO",
];

// Só o DONO alcança a academia inteira de uma vez (RN-164 e RN-165). Para os
// demais, "todas as unidades" seria pedir dados de unidades onde não
// trabalham — a API recusaria, e a tela não deve nem oferecer.
//
// Não tem equivalente no backend: lá a regra aparece como ausência de unidade
// ativa, não como lista de perfis.
export const PERFIS_QUE_VEEM_TODAS: readonly string[] = ["DONO"];
