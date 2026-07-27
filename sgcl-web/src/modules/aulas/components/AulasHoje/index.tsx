import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../../../components/ui/Button";
import { Badge } from "../../../../components/ui/Badge";
import { Loading } from "../../../../components/ui/Loading";
import { AulaService } from "../../services/AulaService";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import type { ItemGradeSemanal } from "../../types";

import "./styles.css";

const BADGE_STATUS: Record<ItemGradeSemanal["status"], { label: string; variant: "warning" | "success" | "danger" }> = {
  AGENDADA: { label: "Pendente", variant: "warning" },
  CONCLUIDA: { label: "Concluída", variant: "success" },
  NAO_REALIZADA: { label: "Não realizada", variant: "danger" },
};

export function AulasHoje() {
  const navigate = useNavigate();

  const [itens, setItens] = useState<ItemGradeSemanal[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [iniciandoId, setIniciandoId] = useState<number | null>(null);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        setLoading(true);
        const grade = await AulaService.gradeSemanal();

        const hoje = new Date().getDay();
        const doDia = grade
          .filter((item) => item.diaSemana === hoje)
          .sort((a, b) => a.horarioInicio.localeCompare(b.horarioInicio));

        if (ativo) setItens(doDia);
      } catch {
        if (ativo) setErro("Não foi possível carregar as aulas de hoje.");
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, []);

  async function handleIniciar(id: number) {
    try {
      setIniciandoId(id);
      const aula = await AulaService.iniciarProgramada(id);
      navigate(`/aulas/${aula.id}/chamada`);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao iniciar aula."));
      setIniciandoId(null);
    }
  }

  if (loading) {
    return (
      <div className="aulas-hoje">
        <h2>Aulas de Hoje</h2>
        <Loading />
      </div>
    );
  }

  if (erro) {
    return (
      <div className="aulas-hoje">
        <h2>Aulas de Hoje</h2>
        <p className="aulas-hoje-vazio">{erro}</p>
      </div>
    );
  }

  if (itens.length === 0) {
    return (
      <div className="aulas-hoje">
        <h2>Aulas de Hoje</h2>
        <p className="aulas-hoje-vazio">Nenhuma aula programada para hoje.</p>
      </div>
    );
  }

  return (
    <div className="aulas-hoje">
      <h2>Aulas de Hoje</h2>

      <div className="aulas-hoje-lista">
        {itens.map((item) => {
          const badge = BADGE_STATUS[item.status];

          return (
            <div key={item.id} className={`aulas-hoje-card aulas-hoje-card-${item.status.toLowerCase()}`}>
              <div className="aulas-hoje-card-topo">
                <span className="aulas-hoje-card-horario">
                  {item.horarioInicio} – {item.horarioFim}
                </span>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </div>

              <strong className="aulas-hoje-card-turma">{item.turmaNome}</strong>
              <span className="aulas-hoje-card-professor">
                {item.professorApelido || "Sem professor definido"}
              </span>

              {item.status === "AGENDADA" && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleIniciar(item.id)}
                  disabled={iniciandoId === item.id}
                >
                  {iniciandoId === item.id ? "Iniciando..." : "Iniciar Aula"}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
