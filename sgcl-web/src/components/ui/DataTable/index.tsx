import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { Input } from "../Input";
import { Pagination } from "../Pagination";

import "./styles.css";

export interface DataTableColumn<T> {
  id?: string;
  header: string;
  accessor?: keyof T;
  width?: number | string;
  align?: "left" | "center" | "right";
  render?: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  title?: string;
  description?: string;
  actions?: ReactNode;

  data: T[];
  columns: DataTableColumn<T>[];

  loading?: boolean;

  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];

  emptyMessage?: string;

  // Paginação (opcional). Informando `pageSize`, a tabela pagina
  // `data` no cliente sozinha. Se além disso vier `totalItems`, a
  // tabela assume que `data` já chegou paginada (ex.: resposta de uma
  // API paginada no servidor) e só usa `totalItems` pra calcular o
  // total de páginas, sem fatiar de novo — assim trocar de client-side
  // pra server-side depois é só passar a página pronta da API.
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
}

export function DataTable<T>({
  title,
  description,
  actions,
  data,
  columns,
  loading = false,
  searchable = false,
  searchPlaceholder = "Pesquisar...",
  searchKeys = [],
  emptyMessage = "Nenhum registro encontrado.",
  pageSize,
  totalItems,
  onPageChange,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filteredData = useMemo(() => {
    if (!searchable || !search.trim() || searchKeys.length === 0) {
      return data;
    }

    const term = search.toLowerCase().trim();

    return data.filter((item) =>
      searchKeys.some((key) => {
        const value = item[key];

        if (value === null || value === undefined) {
          return false;
        }

        return String(value).toLowerCase().includes(term);
      })
    );
  }, [data, search, searchable, searchKeys]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const paginando = !!pageSize;
  const dadosJaPaginadosExternamente = paginando && totalItems !== undefined;
  const totalItensReal = totalItems ?? filteredData.length;
  const totalPaginas = paginando ? Math.max(1, Math.ceil(totalItensReal / pageSize!)) : 1;

  const dadosDaPagina = useMemo(() => {
    if (!paginando || dadosJaPaginadosExternamente) return filteredData;
    const inicio = (page - 1) * pageSize!;
    return filteredData.slice(inicio, inicio + pageSize!);
  }, [filteredData, paginando, dadosJaPaginadosExternamente, page, pageSize]);

  function handlePageChange(novaPagina: number) {
    setPage(novaPagina);
    onPageChange?.(novaPagina);
  }

  return (
    <div className="data-table-wrapper">
      {(title || actions) && (
        <div className="data-table-header">
          <div>
            {title && <h3>{title}</h3>}
            {description && <p>{description}</p>}
          </div>

          {actions && (
            <div className="data-table-actions">
              {actions}
            </div>
          )}
        </div>
      )}

      {searchable && (
        <div className="data-table-toolbar">
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>
      )}

      {loading ? (
        <div className="data-table-loading">
          Carregando...
        </div>
      ) : filteredData.length === 0 ? (
        <p className="data-table-empty">
          {emptyMessage}
        </p>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.id ?? column.header}
                    style={{
                      width: column.width,
                      textAlign: column.align ?? "left",
                    }}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {dadosDaPagina.map((item, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((column) => (
                    <td
                      key={column.id ?? column.header}
                      data-label={column.header}
                      style={{
                        textAlign: column.align ?? "left",
                      }}
                    >
                      {column.render
                        ? column.render(item)
                        : String(
                            column.accessor
                              ? item[column.accessor] ?? "-"
                              : "-"
                          )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {paginando ? (
            <Pagination
              paginaAtual={page}
              totalPaginas={totalPaginas}
              onChangePagina={handlePageChange}
              totalItens={totalItensReal}
              itensPorPagina={pageSize}
            />
          ) : (
            <div className="data-table-footer">
              Total de registros:{" "}
              <strong>{filteredData.length}</strong>
            </div>
          )}
        </>
      )}
    </div>
  );
}
