import { useNavigate } from "react-router-dom";

import { SubHeader } from "../../../../components/ui/SubHeader";
import { Loading } from "../../../../components/ui/Loading";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { EmptyState } from "../../../../components/ui/EmptyState";

import { useMinhasTurmas } from "../../hooks/useMinhasTurmas";
import { formatarDiasSemana } from "../../utils/formatarDiasSemana";

import "./styles.css";

export function Turmas() {
  const navigate = useNavigate();
  const { turmas, carregando, erro, carregarTurmas } = useMinhasTurmas();

  return (
    <div className="turmas-page">
      <SubHeader titulo="Minhas turmas" subtitulo="Grade completa" />

      <main className="turmas-conteudo">
        {carregando && <Loading message="Carregando suas turmas..." />}

        {!carregando && erro && <ErrorMessage message={erro} onRetry={carregarTurmas} />}

        {!carregando && !erro && turmas.length === 0 && (
          <EmptyState
            title="Nenhuma turma vinculada"
            description="Você ainda não está escalado como professor de nenhuma turma."
          />
        )}

        {!carregando &&
          !erro &&
          turmas.map((turma) => (
            <div key={turma.id} className="turma-card">
              <div className="turma-card-topo">
                <h3>{turma.nome}</h3>
                <span className="turma-card-faixa">{turma.faixaEtaria}</span>
              </div>

              <p className="turma-card-horario">
                {formatarDiasSemana(turma.diasSemana)} · {turma.horarioInicio}–{turma.horarioFim}
              </p>

              <p className="turma-card-alunos">
                {turma._count?.alunos ?? 0} aluno{(turma._count?.alunos ?? 0) === 1 ? "" : "s"}
              </p>

              {turma.curriculoId && (
                <button
                  type="button"
                  className="turma-card-link"
                  onClick={() => navigate(`/planejamento?turma=${turma.id}`)}
                >
                  Ver planejamento
                </button>
              )}
            </div>
          ))}
      </main>
    </div>
  );
}
