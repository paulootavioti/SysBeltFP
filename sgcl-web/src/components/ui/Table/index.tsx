import "./styles.css";
import type { ReactNode } from "react";

interface Column<T> {
  header: string;
  accessor: keyof T;
  render?: (item: T) => ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
}

export function Table<T extends { id: number }>({
  columns,
  data,
}: TableProps<T>) {
  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={String(column.accessor)}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              {columns.map((column) => (
                <td key={String(column.accessor)}>
                  {column.render
                    ? column.render(item)
                    : String(item[column.accessor])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}