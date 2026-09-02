import "./styles.css";
import type { ReactNode } from "react";
import { Pagination, type PaginationProps } from "../Pagination";

interface Column<T> {
  header: string;
  accessor: keyof T;
  render?: (item: T) => ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  // opcional: quando informado, mostra a barra de paginação abaixo da
  // tabela. A tabela só renderiza `data` como veio — quem decide se é
  // uma fatia paginada no cliente (ver usePaginacaoCliente) ou uma
  // página já paginada pelo servidor é quem chama <Table>.
  pagination?: PaginationProps;
  onRowClick?: (item: T) => void;
}

export function Table<T extends { id: number }>({
  columns,
  data,
  pagination,
  onRowClick,
}: TableProps<T>) {
  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={`${column.header}-${String(column.accessor)}`}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr
              key={item.id}
              className={onRowClick ? "table-row-clickable" : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={(event) => {
                if (!(event.target as HTMLElement).closest("button, a, input, select, textarea, label")) onRowClick?.(item);
              }}
              onKeyDown={(event) => {
                if (onRowClick && (event.key === "Enter" || event.key === " ")) onRowClick(item);
              }}
            >
              {columns.map((column) => (
                <td
                  key={`${column.header}-${String(column.accessor)}`}
                  data-label={column.header}
                >
                  {column.render
                    ? column.render(item)
                    : String(item[column.accessor])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {pagination && <Pagination {...pagination} />}
    </div>
  );
}
