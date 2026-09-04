import { DashboardVariation } from "./DashboardVariation";
import "./DashboardKpiCard.css";

interface DashboardKpiCardProps {
  titulo: string;
  valor: string;
  complemento?: string;
  variacao?: number | null;
  variacaoInversa?: boolean;
  semDados?: boolean;
  enfase?: "acao";
}

export function DashboardKpiCard({
  titulo,
  valor,
  complemento,
  variacao,
  variacaoInversa,
  semDados,
  enfase,
}: DashboardKpiCardProps) {
  const numero = Number(valor.replace(/[^\d,-]/g, "").replace(/\./g, "").replace(",", "."));
  const destacar = enfase === "acao" && numero > 0;
  return (
    <article className={`dashboard-kpi-card${destacar ? " dashboard-kpi-card-acao" : ""}`}>
      <p className="dashboard-kpi-rotulo">{titulo}</p>
      <h2>{semDados ? "—" : valor}</h2>
      {semDados ? (
        <p className="dashboard-kpi-complemento dashboard-kpi-sem-dados">Sem dados no período.</p>
      ) : (
        <>
          {complemento && <p className="dashboard-kpi-complemento">{complemento}</p>}
          {variacao !== undefined && <DashboardVariation percentual={variacao} inverso={variacaoInversa} />}
        </>
      )}
    </article>
  );
}
