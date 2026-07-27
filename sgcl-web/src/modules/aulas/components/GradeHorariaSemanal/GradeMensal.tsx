import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Loading } from "../../../../components/ui/Loading";
import { Tooltip } from "../../../../components/ui/Tooltip";
import { AulaService } from "../../services/AulaService";
import type { AulaProgramada } from "../../types";

const DIAS_SEMANA_LABEL = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const CLASSE_STATUS: Record<AulaProgramada["status"], string> = {
  PENDENTE: "grade-item-agendada",
  INICIADA: "grade-item-concluida",
  CANCELADA: "grade-item-cancelada",
};

// mesma lógica UTC-safe usada na visão semanal — datas de AulaProgramada
// são instantes absolutos, então agrupar por dia calendário exige campos
// UTC em vez de métodos locais.
function segundaAnterior(data: Date): Date {
  const dia = data.getUTCDay();
  const offset = dia === 0 ? 6 : dia - 1;
  const resultado = new Date(data);
  resultado.setUTCDate(resultado.getUTCDate() - offset);
  return resultado;
}

function chaveDia(data: Date): string {
  const ano = data.getUTCFullYear();
  const mes = String(data.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(data.getUTCDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function horarioDoItem(item: AulaProgramada): string {
  const data = new Date(item.data);
  const horas = String(data.getUTCHours()).padStart(2, "0");
  const minutos = String(data.getUTCMinutes()).padStart(2, "0");
  return `${horas}:${minutos}`;
}

interface GradeMensalProps {
  onAgendar: (dataHoraLocal: string) => void;
}

export function GradeMensal({ onAgendar }: GradeMensalProps) {
  const navigate = useNavigate();

  const [itens, setItens] = useState<AulaProgramada[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        setLoading(true);
        const dados = await AulaService.listarProgramadas({ periodo: "MENSAL" });
        if (ativo) setItens(dados);
      } catch {
        if (ativo) setErro("Não foi possível carregar a grade do mês.");
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, []);

  if (loading) return <Loading message="Carregando grade..." />;
  if (erro) return <p className="grade-semanal-vazio">{erro}</p>;

  const hoje = new Date();
  const mesReferencia = hoje.getUTCMonth();
  const anoReferencia = hoje.getUTCFullYear();
  const primeiroDia = new Date(Date.UTC(anoReferencia, mesReferencia, 1));
  const inicioGrade = segundaAnterior(primeiroDia);

  const dias: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const dia = new Date(inicioGrade);
    dia.setUTCDate(dia.getUTCDate() + i);
    dias.push(dia);
  }

  const itensPorDia = new Map<string, AulaProgramada[]>();
  for (const item of itens) {
    const chave = chaveDia(new Date(item.data));
    const lista = itensPorDia.get(chave) ?? [];
    lista.push(item);
    itensPorDia.set(chave, lista);
  }

  const nomeMes = hoje.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <div className="grade-mensal">
      <h3 className="grade-mensal-titulo">{nomeMes}</h3>

      <div className="grade-mensal-grid">
        {DIAS_SEMANA_LABEL.map((label) => (
          <div key={label} className="grade-mensal-cabecalho">
            {label}
          </div>
        ))}

        {dias.map((dia) => {
          const chave = chaveDia(dia);
          const foraDoMes = dia.getUTCMonth() !== mesReferencia;
          const itensDoDia = (itensPorDia.get(chave) ?? []).sort((a, b) => a.data.localeCompare(b.data));

          return (
            <div key={chave} className={`grade-mensal-dia${foraDoMes ? " grade-mensal-dia-fora" : ""}`}>
              <div className="grade-mensal-dia-cabecalho">
                <span className="grade-mensal-dia-numero">{dia.getUTCDate()}</span>

                {!foraDoMes && (
                  <button
                    type="button"
                    className="grade-mensal-dia-adicionar"
                    aria-label={`Programar aula em ${chave}`}
                    onClick={() => onAgendar(`${chave}T08:00`)}
                  >
                    +
                  </button>
                )}
              </div>

              <div className="grade-mensal-dia-itens">
                {itensDoDia.map((item) => {
                  const professor = item.turma.professor?.apelido || item.turma.professor?.nome || "-";
                  const arena = item.turma.arena?.nome || "-";

                  return (
                    <Tooltip key={item.id} content={`Professor(a): ${professor} — Arena: ${arena}`}>
                      <button
                        type="button"
                        className={`grade-item ${CLASSE_STATUS[item.status]}`}
                        onClick={() => navigate(`/turmas/${item.turmaId}`)}
                      >
                        {horarioDoItem(item)} {item.turma.nome}
                      </button>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
