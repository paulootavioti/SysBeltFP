import type { ReactNode } from "react";
import "./DashboardSection.css";

interface DashboardSectionProps {
  titulo: string;
  subtitulo?: string;
  acao?: ReactNode;
  children: ReactNode;
}

export function DashboardSection({ titulo, subtitulo, acao, children }: DashboardSectionProps) {
  return (
    <section className="dashboard-secao" aria-labelledby={`dashboard-secao-${titulo}`}>
      <div className="dashboard-secao-cabecalho">
        <div>
          <h2 id={`dashboard-secao-${titulo}`}>{titulo}</h2>
          {subtitulo && <p className="dashboard-secao-rubrica">{subtitulo}</p>}
        </div>

        {acao && <div className="dashboard-secao-acao">{acao}</div>}
      </div>

      {children}
    </section>
  );
}
