import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Loading } from "../../../../components/ui/Loading";
import { Tooltip } from "../../../../components/ui/Tooltip";
import { AulaService } from "../../services/AulaService";
import type { ItemGradeSemanal } from "../../types";

import "./styles.css";

interface GradeHorariaSemanalProps {
  compacta?: boolean;
}

const DIAS_SEMANA = [
  { indice: 1, label: "Seg" },
  { indice: 2, label: "Ter" },
  { indice: 3, label: "Qua" },
  { indice: 4, label: "Qui" },
  { indice: 5, label: "Sex" },
  { indice: 6, label: "Sáb" },
  { indice: 0, label: "Dom" },
];

const CLASSE_STATUS: Record<ItemGradeSemanal["status"], string> = {
  AGENDADA: "grade-item-agendada",
  CONCLUIDA: "grade-item-concluida",
  NAO_REALIZADA: "grade-item-nao-realizada",
};

export function GradeHorariaSemanal({ compacta = false }: GradeHorariaSemanalProps) {
  const navigate = useNavigate();

  const [itens, setItens] = useState<ItemGradeSemanal[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        setLoading(true);
        const dados = await AulaService.gradeSemanal();
        if (ativo) setItens(dados);
      } catch {
        if (ativo) setErro("Não foi possível carregar a grade horária.");
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, []);

  const horarios = Array.from(new Set(itens.map((item) => item.horarioInicio))).sort();

  return (
    <div className={`grade-semanal${compacta ? " grade-semanal-compacta" : ""}`}>
      <h2>Grade Horária Semanal</h2>

      {loading ? (
        <Loading message="Carregando grade..." />
      ) : erro ? (
        <p className="grade-semanal-vazio">{erro}</p>
      ) : horarios.length === 0 ? (
        <p className="grade-semanal-vazio">Nenhuma aula programada nesta semana.</p>
      ) : (
        <div className="grade-semanal-wrapper">
          <table className="grade-semanal-table">
            <thead>
              <tr>
                <th>Horário</th>
                {DIAS_SEMANA.map((dia) => (
                  <th key={dia.indice}>{dia.label}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {horarios.map((horario) => (
                <tr key={horario}>
                  <td className="grade-semanal-horario">{horario}</td>

                  {DIAS_SEMANA.map((dia) => {
                    const itensDaCelula = itens.filter(
                      (item) => item.horarioInicio === horario && item.diaSemana === dia.indice
                    );

                    return (
                      <td key={dia.indice}>
                        {itensDaCelula.map((item) => (
                          <Tooltip
                            key={item.id}
                            content={`Professor(a): ${item.professorApelido || "-"}`}
                          >
                            <button
                              type="button"
                              className={`grade-item ${CLASSE_STATUS[item.status]}`}
                              onClick={() => navigate(`/turmas/${item.turmaId}`)}
                            >
                              {item.turmaNome}
                            </button>
                          </Tooltip>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
