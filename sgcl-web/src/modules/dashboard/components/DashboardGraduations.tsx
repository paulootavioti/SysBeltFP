import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { DashboardEmptyState } from "./DashboardEmptyState";
import { formatarPercentual } from "../utils/formatters";
import type { AlunoElegivel } from "../../graduacoes/types";
import "./progressBar.css";
import "./DashboardGraduations.css";

interface DashboardGraduationsProps {
  alunos: AlunoElegivel[];
}

// Mesmo ciclo de 32 aulas (4 graus) usado no backend (`ListProximasGraduacoesService`).
const AULAS_POR_FAIXA = 32;

export function DashboardGraduations({ alunos }: DashboardGraduationsProps) {
  const navigate = useNavigate();

  return (
    <div>
      {alunos.length === 0 ? (
        <DashboardEmptyState title="Nenhum aluno elegível no momento" />
      ) : (
        <div className="dashboard-lista">
          {alunos.slice(0, 5).map((aluno) => {
            const aulasRealizadas = aluno.aulasRealizadas ?? 0;
            const percentual = aluno.percentualProgresso ?? 0;
            const restantes = aluno.aulasRestantes ?? 0;

            return (
              <div key={aluno.alunoId} className="dashboard-graduacao-item">
                <div className="dashboard-graduacao-cabecalho">
                  <strong>{aluno.nome}</strong>
                  <span>
                    {aluno.faixa}
                    {aluno.proximaFaixa ? ` → ${aluno.proximaFaixa}` : ""}
                  </span>
                </div>

                <div
                  className="dashboard-meta-barra"
                  role="progressbar"
                  aria-label={`Progresso de graduação de ${aluno.nome}`}
                  aria-valuenow={Math.round(percentual)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="dashboard-meta-barra-preenchida" style={{ width: `${Math.min(100, percentual)}%` }} />
                </div>

                <p className="dashboard-graduacao-detalhe">
                  {aulasRealizadas} de {AULAS_POR_FAIXA} aulas • {formatarPercentual(percentual)} concluído
                  {restantes > 0 ? ` • Faltam ${restantes} aula(s)` : ""}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <Button type="button" variant="secondary" onClick={() => navigate("/graduacoes/proximas")}>
        Ver todos
      </Button>
    </div>
  );
}
