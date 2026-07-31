import { Button } from "../Button";
import { DataTable } from "../DataTable";
import { Actions } from "../DataTable/Actions";

import type { DataTableColumn } from "../DataTable";

interface CrudDataTableProps<T> {
  title: string;
  description?: string;

  data: T[];
  columns: DataTableColumn<T>[];

  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];

  emptyMessage?: string;

  createLabel?: string;

  onCreate?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;

  loading?: boolean;

  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
}

export function CrudDataTable<T>({
  title,
  description,
  data,
  columns,
  searchable,
  searchPlaceholder,
  searchKeys,
  emptyMessage,
  createLabel = "Novo",
  onCreate,
  onEdit,
  onDelete,
  loading = false,
  pageSize,
  totalItems,
  onPageChange,
}: CrudDataTableProps<T>) {
  const finalColumns: DataTableColumn<T>[] = [
    ...columns,
  ];
  
  if (onEdit || onDelete) {
    finalColumns.push({
      id: "acoes",
      header: "",
      width: 180,
      align: "center",
      render: (item) => (
        <Actions
          onEdit={
            onEdit
              ? () => onEdit(item)
              : undefined
          }
          onDelete={
            onDelete
              ? () => onDelete(item)
              : undefined
          }
        />
      ),
    });
  }

  return (
    <DataTable
      title={title}
      description={description}
      searchable={searchable}
      searchPlaceholder={searchPlaceholder}
      searchKeys={searchKeys}
      actions={
        onCreate ? (
          <Button type="button" onClick={onCreate}>
            {createLabel}
          </Button>
        ) : undefined
      }
      data={data}
      columns={finalColumns}
      emptyMessage={emptyMessage}
      loading={loading}
      pageSize={pageSize}
      totalItems={totalItems}
      onPageChange={onPageChange}
    />
  );
}