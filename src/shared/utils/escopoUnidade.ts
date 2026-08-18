import { AppError } from "../errors/AppError";
import { obterContextoRequisicao } from "../context/contextoRequisicao";

// Quem tem unidade ativa só vê o que é dela. Quem NÃO tem — o DONO, que por
// RN-164 alcança todas as filiais da própria academia — vê as unidades da
// própria conta, e só elas.
//
// "Sem unidade ativa" já significou "vê tudo", de quando SUPERADMIN existia e
// um banco continha uma academia só. Hoje o operador da plataforma vive no
// Control Plane (RN-167) e um banco pode conter mais de um assinante, então
// ausência de filtro deixou de ser alcance de administrador e virou vazamento
// entre contas.
//
// Restam dois casos legítimos de unidade nula, e eles não são o mesmo:
//
//   usuário sem unidade fixa  → as unidades da conta dele (lidas do contexto)
//   rotina interna sem usuário → o tenant inteiro (cron de cobrança, lembretes)
//
// O que separa os dois é haver usuário autenticado no contexto. Na dúvida —
// há usuário mas a lista não foi preenchida — o alcance é vazio, não total.
export type EscopoUnidade = { unidadeId?: number | { in: number[] } };

export function escopoUnidade(unidadeId: number | null): EscopoUnidade {
  if (unidadeId !== null) return { unidadeId };

  const { usuarioId, unidadesDoUsuario } = obterContextoRequisicao();

  if (usuarioId === null) return {};

  return { unidadeId: { in: unidadesDoUsuario ?? [] } };
}

// Escopo estreitado por um filtro de tela ("ver só a filial X"). O filtro só
// estreita, nunca amplia: uma unidade fora do alcance é ignorada, e o escopo
// normal de quem pediu continua valendo.
//
// Sem isso, um id de unidade vindo da querystring sobrescreveria o `where` do
// escopo e leria outra academia.
export function escopoUnidadeFiltrada(
  unidadeId: number | null,
  pedida?: number | null
): EscopoUnidade {
  const alcance = escopoUnidade(unidadeId);

  if (!pedida) return alcance;

  // Rotina interna: não há alcance a respeitar, o filtro vale como veio.
  if (alcance.unidadeId === undefined) return { unidadeId: pedida };

  // Quem já está preso a uma unidade não filtra para lugar nenhum.
  if (typeof alcance.unidadeId === "number") return alcance;

  return alcance.unidadeId.in.includes(pedida) ? { unidadeId: pedida } : alcance;
}

// O mesmo escopo, aplicado à chave primária de Unidade — para queries sobre a
// própria tabela de unidades, onde a coluna se chama `id` e não `unidadeId`.
// Deriva de `escopoUnidade` de propósito: a decisão de quem alcança o quê fica
// num lugar só.
export function escopoDeUnidadePropria(
  unidadeId: number | null
): { id?: number | { in: number[] } } {
  const { unidadeId: alcance } = escopoUnidade(unidadeId);

  return alcance === undefined ? {} : { id: alcance };
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
  if (unidadeIdUsuario !== null) {
    // Um registro sem unidade também é negado: não pertence a esta unidade.
    if (unidadeIdUsuario !== unidadeIdRegistro) {
      throw new AppError(mensagem);
    }
    return;
  }

  const { usuarioId, unidadesDoUsuario } = obterContextoRequisicao();

  // Rotina interna sem usuário: alcança o tenant inteiro, como na leitura.
  if (usuarioId === null) return;

  if (unidadeIdRegistro === null || !(unidadesDoUsuario ?? []).includes(unidadeIdRegistro)) {
    throw new AppError(mensagem);
  }
}
