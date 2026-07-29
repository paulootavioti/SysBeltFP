import { useNavigate } from "react-router-dom";

import { Table } from "../../../components/ui/Table";
import { EmptyState } from "../../../components/ui/EmptyState";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { formatarData, formatarMoeda } from "../../dashboard/utils/formatters";
import { calcularStatusMensalidade } from "../../mensalidades/utils/status";
import { nomeFormaPagamento } from "../../formasPagamento/types";
import type { MensalidadeComAluno } from "../../mensalidades/types";

const STATUS_BADGE = {
  PAGA: "PAGO",
  PENDENTE: "PENDENTE",
  VENCIDA: "VENCIDO",
  CANCELADA: "CANCELADO",
  ESTORNADA: "ESTORNADO",
} as const;

interface ContasTableProps {
  contas: MensalidadeComAluno[];
  emptyTitle: string;
  emptyDescription: string;
}

export function ContasTable({ contas, emptyTitle, emptyDescription }: ContasTableProps) {
  const navigate = useNavigate();

  if (contas.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  const columns = [
    { header: "Aluno", accessor: "aluno" as const, render: (c: MensalidadeComAluno) => c.aluno?.nome },
    { header: "Valor", accessor: "valorFinal" as const, render: (c: MensalidadeComAluno) => formatarMoeda(c.valorFinal || c.valor) },
    { header: "Vencimento", accessor: "vencimento" as const, render: (c: MensalidadeComAluno) => formatarData(c.vencimento) },
    {
      header: "Forma de Pagamento",
      accessor: "formaPagamento" as const,
      render: (c: MensalidadeComAluno) => (c.formaPagamento ? nomeFormaPagamento(c.formaPagamento) : "—"),
    },
    {
      header: "Status",
      accessor: "status" as const,
      render: (c: MensalidadeComAluno) => <StatusBadge status={STATUS_BADGE[calcularStatusMensalidade(c)]} />,
    },
    {
      header: "Ações",
      accessor: "id" as const,
      render: (c: MensalidadeComAluno) => (
        <button type="button" className="contas-table-link" onClick={() => navigate(`/mensalidades/${c.id}`)}>
          Ver detalhes
        </button>
      ),
    },
  ];

  return <Table columns={columns} data={contas} />;
}
