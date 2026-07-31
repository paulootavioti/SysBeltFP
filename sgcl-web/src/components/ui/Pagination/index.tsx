import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import "./styles.css";

export interface PaginationProps {
  paginaAtual: number;
  totalPaginas: number;
  onChangePagina: (pagina: number) => void;
  totalItens?: number;
  itensPorPagina?: number;
}

const PONTOS = "…";

// Monta a lista de páginas a mostrar: sempre a primeira, a última, a
// atual e uma vizinha de cada lado — o resto vira "…". Evita uma barra
// de 50 botões quando há muitas páginas.
function paginasVisiveis(paginaAtual: number, totalPaginas: number): (number | typeof PONTOS)[] {
  const paginas = new Set<number>([1, totalPaginas, paginaAtual, paginaAtual - 1, paginaAtual + 1]);

  const ordenadas = Array.from(paginas)
    .filter((p) => p >= 1 && p <= totalPaginas)
    .sort((a, b) => a - b);

  const resultado: (number | typeof PONTOS)[] = [];
  ordenadas.forEach((pagina, indice) => {
    if (indice > 0 && pagina - ordenadas[indice - 1] > 1) {
      resultado.push(PONTOS);
    }
    resultado.push(pagina);
  });

  return resultado;
}

export function Pagination({
  paginaAtual,
  totalPaginas,
  onChangePagina,
  totalItens,
  itensPorPagina,
}: PaginationProps) {
  if (totalPaginas <= 1) return null;

  const primeiroItem = totalItens !== undefined && itensPorPagina ? (paginaAtual - 1) * itensPorPagina + 1 : null;
  const ultimoItem =
    totalItens !== undefined && itensPorPagina ? Math.min(paginaAtual * itensPorPagina, totalItens) : null;

  return (
    <nav className="pagination" aria-label="Paginação">
      {primeiroItem !== null && ultimoItem !== null && (
        <span className="pagination-resumo">
          Mostrando {primeiroItem}–{ultimoItem} de {totalItens}
        </span>
      )}

      <div className="pagination-botoes">
        <button
          type="button"
          className="pagination-botao"
          onClick={() => onChangePagina(paginaAtual - 1)}
          disabled={paginaAtual === 1}
          aria-label="Página anterior"
        >
          <LuChevronLeft size={16} />
        </button>

        {paginasVisiveis(paginaAtual, totalPaginas).map((pagina, indice) =>
          pagina === PONTOS ? (
            <span key={`pontos-${indice}`} className="pagination-pontos">
              {PONTOS}
            </span>
          ) : (
            <button
              key={pagina}
              type="button"
              className={`pagination-botao${pagina === paginaAtual ? " pagination-botao-ativo" : ""}`}
              onClick={() => onChangePagina(pagina)}
              aria-label={`Página ${pagina}`}
              aria-current={pagina === paginaAtual ? "page" : undefined}
            >
              {pagina}
            </button>
          )
        )}

        <button
          type="button"
          className="pagination-botao"
          onClick={() => onChangePagina(paginaAtual + 1)}
          disabled={paginaAtual === totalPaginas}
          aria-label="Próxima página"
        >
          <LuChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}
