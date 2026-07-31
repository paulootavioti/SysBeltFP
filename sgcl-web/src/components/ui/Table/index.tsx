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
}

export function Table<T extends { id: number }>({
  columns,
  data,
  pagination,
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
            <tr key={item.id}>
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
