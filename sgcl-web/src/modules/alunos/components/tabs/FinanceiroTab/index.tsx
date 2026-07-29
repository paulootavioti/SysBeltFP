import { StatusBadge } from "../../../../../components/ui/StatusBadge";
import { calcularStatusMensalidade } from "../../../../mensalidades/utils/status";
import { calcularStatusFinanceiroAluno } from "../../../utils/statusFinanceiro";

import type { AlunoCompleto } from "../../../types/alunoCompleto";

import "./styles.css";

const MAPA_BADGE = {
  PAGA: "PAGO",
  PENDENTE: "PENDENTE",
  VENCIDA: "VENCIDO",
} as const;

interface FinanceiroTabProps {
  aluno: AlunoCompleto;
}

export function FinanceiroTab({ aluno }: FinanceiroTabProps) {
  const statusGeral = calcularStatusFinanceiroAluno(aluno.mensalidades);

  if (!aluno.mensalidades?.length) {
    return <p>Nenhuma mensalidade cadastrada.</p>;
  }

  return (
    <div className="financeiro-tab">
      <div className="financeiro-tab-resumo">
        <h3>Mensalidades</h3>
        {statusGeral && <StatusBadge status={statusGeral} />}
      </div>

      <div className="financeiro-tab-lista">
        {aluno.mensalidades.map((mensalidade) => (
          <div key={mensalidade.id} className="financeiro-tab-item">
            <span className="financeiro-tab-valor">
              R$ {mensalidade.valor.toFixed(2)}
            </span>
            <span className="financeiro-tab-vencimento">
              Vencimento: {new Date(mensalidade.vencimento).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
            </span>
            <StatusBadge status={MAPA_BADGE[calcularStatusMensalidade(mensalidade)]} />
          </div>
        ))}
      </div>
    </div>
  );
}