import { useEffect, useMemo, useState } from "react";

export interface PaginacaoCliente<T> {
  paginaAtual: number;
  totalPaginas: number;
  totalItens: number;
  itensPorPagina: number;
  itensDaPagina: T[];
  irParaPagina: (pagina: number) => void;
}

// Paginação client-side: recebe a lista já filtrada/pesquisada e devolve
// só a fatia da página atual, no mesmo formato que uma paginação
// server-side devolveria (paginaAtual/totalPaginas/totalItens) — trocar
// isso por uma busca paginada na API depois é só passar a fatia que a
// API já devolve pronta e usar o total que ela informar, sem mudar quem
// consome (Table/DataTable/Pagination não sabem se a fatia veio do
// cliente ou do servidor).
//
// `resetDeps` reseta a página pra 1 quando muda (ex.: termo de busca ou
// filtro) — sem isso, trocar o filtro enquanto navega na página 3
// deixaria a tela em branco até o usuário voltar manualmente.
export function usePaginacaoCliente<T>(
  dados: T[],
  itensPorPagina = 10,
  resetDeps: unknown[] = []
): PaginacaoCliente<T> {
  const [paginaAtual, setPaginaAtual] = useState(1);

  const totalPaginas = Math.max(1, Math.ceil(dados.length / itensPorPagina));

  useEffect(() => {
    setPaginaAtual(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDeps);

  useEffect(() => {
    setPaginaAtual((atual) => Math.min(atual, totalPaginas));
  }, [totalPaginas]);

  const itensDaPagina = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return dados.slice(inicio, inicio + itensPorPagina);
  }, [dados, paginaAtual, itensPorPagina]);

  return {
    paginaAtual,
    totalPaginas,
    totalItens: dados.length,
    itensPorPagina,
    itensDaPagina,
    irParaPagina: setPaginaAtual,
  };
}
