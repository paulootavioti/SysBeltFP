import { Card } from "../../../components/ui/Card";
import { DashboardVariation } from "./DashboardVariation";
import "./DashboardKpiCard.css";

interface DashboardKpiCardProps {
  titulo: string;
  valor: string;
  complemento?: string;
  variacao?: number | null;
  variacaoInversa?: boolean;
  semDados?: boolean;
}

export function DashboardKpiCard({
  titulo,
  valor,
  complemento,
  variacao,
  variacaoInversa,
  semDados,
}: DashboardKpiCardProps) {
  return (
    <Card titulo={titulo} valor={semDados ? "—" : valor} className="dashboard-kpi-card">
      {semDados ? (
        <p className="dashboard-kpi-complemento dashboard-kpi-sem-dados">Sem dados no período.</p>
      ) : (
        <>
          {complemento && <p className="dashboard-kpi-complemento">{complemento}</p>}
          {variacao !== undefined && <DashboardVariation percentual={variacao} inverso={variacaoInversa} />}
        </>
      )}
    </Card>
  );
}
