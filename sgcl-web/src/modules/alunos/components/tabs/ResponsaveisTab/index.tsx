import { Button } from "../../../../../components/ui/Button";
import { DataTable } from "../../../../../components/ui/DataTable";

import { Badge } from "../../../../../components/ui/Badge";
import { Actions } from "../../../../../components/ui/DataTable/Actions";

import type { Responsavel } from "../../../../responsaveis/types/responsavel";

import "./styles.css";

interface ResponsaveisTabProps {
  responsaveis: Responsavel[];
  onNovo?: () => void;
  onEditar?: (responsavel: Responsavel) => void;
  onExcluir?: (responsavel: Responsavel) => void;
}

export function ResponsaveisTab({
  responsaveis,
  onNovo,
  onEditar,
  onExcluir,
}: ResponsaveisTabProps) {
  return (
    <section className="responsaveis-tab">
      <DataTable
        title="Responsáveis"
        description="Responsáveis vinculados ao aluno."
        searchable
        searchPlaceholder="Pesquisar responsável..."
        searchKeys={["nome", "parentesco", "telefone", "email"]}
        actions={
          <Button type="button" onClick={onNovo}>
            Novo Responsável
          </Button>
        }
        data={responsaveis}
        emptyMessage="Nenhum responsável cadastrado."
        columns={[
          {
            header: "Nome",
            accessor: "nome",
          },
          {
            header: "Parentesco",
            render: (responsavel) =>
              responsavel.parentesco || "-",
          },
          {
            header: "Telefone",
            render: (responsavel) =>
              responsavel.telefone || "-",
          },
          {
            header: "Email",
            render: (responsavel) =>
              responsavel.email || "-",
          },
          {
            header: "Financeiro",
            render: (responsavel) =>
              responsavel.responsavelFinanceiro ? (
                <Badge variant="success">Sim</Badge>
              ) : (
                <Badge variant="neutral">Não</Badge>
              ),
          },
          {
            id: "acoes",
            header: "",
            width: 180,
            align: "center",
            render: (responsavel) => (
              <Actions
                onEdit={() => onEditar?.(responsavel)}
                onDelete={() => onExcluir?.(responsavel)}
              />
            ),
          },
        ]}
      />
    </section>
  );
}