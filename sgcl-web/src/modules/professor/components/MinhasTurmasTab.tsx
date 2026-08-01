import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../../components/ui/Button";
import { Loading } from "../../../components/ui/Loading";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { EmptyState } from "../../../components/ui/EmptyState";

import { useMinhasTurmas } from "../hooks/useMinhasTurmas";
import { AulaService } from "../../aulas/services/AulaService";
import { getApiErrorMessage } from "../../../shared/utils/getApiErrorMessage";
import { formatarDiasSemana } from "../../../shared/constants/diasSemana";
import type { ItemGradeSemanal } from "../../aulas/types";
import type { Turma } from "../../turmas/types/turma";

interface MinhasTurmasTabProps {
  onVerPlanejamento: (turma: Turma) => void;
}

export function MinhasTurmasTab({ onVerPlanejamento }: MinhasTurmasTabProps) {
  const navigate = useNavigate();
  const { turmas, loading, erro } = useMinhasTurmas();

  const [grade, setGrade] = useState<ItemGradeSemanal[]>([]);
  const [erroChamada, setErroChamada] = useState("");
  const [iniciandoTurmaId, setIniciandoTurmaId] = useState<number | null>(null);

  useEffect(() => {
    AulaService.gradeSemanal().then(setGrade).catch(() => setGrade([]));
  }, []);

  const hoje = new Date().getDay();

  function itemDeHoje(turmaId: number) {
    return grade.find((item) => item.turmaId === turmaId && item.diaSemana === hoje);
  }

  async function handleFazerChamada(turma: Turma) {
    const item = itemDeHoje(turma.id);
    if (!item) return;

    try {
      setErroChamada("");

      if (item.status === "CONCLUIDA" && item.aulaId) {
        navigate(`/aulas/${item.aulaId}/chamada`);
        return;
      }

      if (item.status === "AGENDADA") {
        setIniciandoTurmaId(turma.id);
        const aula = await AulaService.iniciarProgramada(item.id);
        navigate(`/aulas/${aula.id}/chamada`);
      }
    } catch (error) {
      setErroChamada(getApiErrorMessage(error, "Não foi possível abrir a chamada."));
    } finally {
      setIniciandoTurmaId(null);
    }
  }

  if (loading) return <Loading />;
  if (erro) return <ErrorMessage message={erro} />;

  if (turmas.length === 0) {
    return (
      <EmptyState
        title="Nenhuma turma vinculada"
        description="Você ainda não está escalado como professor de nenhuma turma."
      />
    );
  }

  return (
    <div className="professor-turmas-lista">
      <ErrorMessage message={erroChamada} />

      {turmas.map((turma) => {
        const item = itemDeHoje(turma.id);
        const temAulaHoje = !!item && item.status !== "NAO_REALIZADA";

        return (
          <div key={turma.id} className="professor-turma-card">
            <div className="professor-turma-card-topo">
              <h3>{turma.nome}</h3>
              <span className="professor-turma-card-faixa">{turma.faixaEtaria}</span>
            </div>

            <p className="professor-turma-card-horario">
              {formatarDiasSemana(turma.diasSemana)} · {turma.horarioInicio} – {turma.horarioFim}
            </p>

            <p className="professor-turma-card-alunos">
              {turma._count?.alunos ?? 0} aluno{(turma._count?.alunos ?? 0) === 1 ? "" : "s"}
            </p>

            <div className="professor-turma-card-acoes">
              <Button
                type="button"
                size="sm"
                disabled={!temAulaHoje || iniciandoTurmaId === turma.id}
                onClick={() => handleFazerChamada(turma)}
              >
                {iniciandoTurmaId === turma.id
                  ? "Abrindo..."
                  : temAulaHoje
                  ? "Fazer chamada"
                  : "Sem aula hoje"}
              </Button>

              <Button type="button" size="sm" variant="secondary" onClick={() => onVerPlanejamento(turma)}>
                Ver planejamento
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
