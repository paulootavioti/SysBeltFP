import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Loading } from "../../../../components/ui/Loading";
import { Tooltip } from "../../../../components/ui/Tooltip";
import { Modal } from "../../../../components/ui/Modal";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { AulaService } from "../../services/AulaService";
import { ProgramarAulaForm, type ProgramarAulaFormData } from "../ProgramarAulaForm";
import { GradeMensal } from "./GradeMensal";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import { useAuth } from "../../../../contexts/useAuth";
import { UnidadeService } from "../../../unidades/services/UnidadeService";
import type { ItemGradeSemanal } from "../../types";
import type { UnidadeOpcao } from "../../../unidades/types/unidade";

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

// deriva a segunda-feira da semana a partir de um item real (data + diaSemana
// desse item) usando campos UTC — a "data" vem como meia-noite UTC do dia
// calendário, então misturar com métodos locais desalinharia o cálculo.
function segundaDaSemana(item: ItemGradeSemanal): Date {
  const data = new Date(item.data);
  const offset = item.diaSemana === 0 ? 6 : item.diaSemana - 1;
  const segunda = new Date(data);
  segunda.setUTCDate(segunda.getUTCDate() - offset);
  return segunda;
}

function dataDoDia(segunda: Date, diaIndice: number): Date {
  const offset = diaIndice === 0 ? 6 : diaIndice - 1;
  const data = new Date(segunda);
  data.setUTCDate(data.getUTCDate() + offset);
  return data;
}

function paraDatetimeLocal(data: Date, horario: string): string {
  const ano = data.getUTCFullYear();
  const mes = String(data.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(data.getUTCDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}T${horario}`;
}

// ADMIN e PROFESSOR podem consultar (só leitura) a grade de outra unidade
// pra efeito informativo — RECEPCAO e SUPERADMIN (que já tem o seletor
// global de "unidade visualizada") não usam esse seletor local.
const PERFIS_COM_CONSULTA_CROSS_UNIT = ["ADMIN", "PROFESSOR"];

export function GradeHorariaSemanal({ compacta = false }: GradeHorariaSemanalProps) {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [visualizacao, setVisualizacao] = useState<"semana" | "mes">("semana");

  const [itens, setItens] = useState<ItemGradeSemanal[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [dataHoraNovaAula, setDataHoraNovaAula] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [mesRefreshKey, setMesRefreshKey] = useState(0);

  const [unidadesConsulta, setUnidadesConsulta] = useState<UnidadeOpcao[]>([]);
  const [unidadeConsultaId, setUnidadeConsultaId] = useState("");

  const podeConsultarOutraUnidade =
    !compacta && !!usuario?.perfil && PERFIS_COM_CONSULTA_CROSS_UNIT.includes(usuario.perfil);
  const apenasConsulta = podeConsultarOutraUnidade && unidadeConsultaId !== "";

  useEffect(() => {
    if (!podeConsultarOutraUnidade) return;
    UnidadeService.listarOpcoes().then(setUnidadesConsulta);
  }, [podeConsultarOutraUnidade]);

  async function carregar() {
    try {
      setLoading(true);
      setErro("");
      const dados = await AulaService.gradeSemanal(
        unidadeConsultaId ? Number(unidadeConsultaId) : undefined
      );
      setItens(dados);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Não foi possível carregar a grade horária."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unidadeConsultaId]);

  const horarios = Array.from(new Set(itens.map((item) => item.horarioInicio))).sort();

  function abrirProgramar(diaIndice: number, horario: string) {
    if (itens.length === 0) return;
    const segunda = segundaDaSemana(itens[0]);
    const data = dataDoDia(segunda, diaIndice);
    setDataHoraNovaAula(paraDatetimeLocal(data, horario));
  }

  async function handleProgramar(data: ProgramarAulaFormData) {
    try {
      setSalvando(true);
      setErro("");

      if (data.modo === "unica") {
        await AulaService.criarProgramada({
          turmaId: Number(data.turmaId),
          aulaCurriculoId: data.aulaCurriculoId ? Number(data.aulaCurriculoId) : undefined,
          data: data.data as string,
          observacoes: data.observacoes || undefined,
        });
      } else {
        await AulaService.replicarProgramada({
          turmaId: Number(data.turmaId),
          aulaCurriculoId: data.aulaCurriculoId ? Number(data.aulaCurriculoId) : undefined,
          dataInicio: data.dataInicio as string,
          dataFim: data.dataFim as string,
          diasSemana: data.diasSemana as number[],
          observacoes: data.observacoes || undefined,
        });
      }

      setDataHoraNovaAula(null);
      await carregar();
      setMesRefreshKey((chave) => chave + 1);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao programar aula."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className={`grade-semanal${compacta ? " grade-semanal-compacta" : ""}`}>
      <div className="grade-semanal-cabecalho">
        <h2>Grade Horária {visualizacao === "semana" ? "Semanal" : "Mensal"}</h2>

        {!compacta && (
          <div className="grade-semanal-visualizacao" role="group" aria-label="Visualização da grade">
            <button
              type="button"
              className={`grade-semanal-visualizacao-item${visualizacao === "semana" ? " active" : ""}`}
              aria-pressed={visualizacao === "semana"}
              onClick={() => setVisualizacao("semana")}
            >
              Semana
            </button>
            <button
              type="button"
              className={`grade-semanal-visualizacao-item${visualizacao === "mes" ? " active" : ""}`}
              aria-pressed={visualizacao === "mes"}
              onClick={() => setVisualizacao("mes")}
            >
              Mês
            </button>
          </div>
        )}
      </div>

      {podeConsultarOutraUnidade && (
        <label className="grade-semanal-consulta-unidade">
          <span>Consultar grade de</span>
          <select value={unidadeConsultaId} onChange={(e) => setUnidadeConsultaId(e.target.value)}>
            <option value="">Minha unidade</option>
            {unidadesConsulta.map((unidade) => (
              <option key={unidade.id} value={String(unidade.id)}>
                {unidade.nome}
              </option>
            ))}
          </select>
          {apenasConsulta && <span className="grade-semanal-consulta-aviso">Somente consulta</span>}
        </label>
      )}

      {visualizacao === "mes" && !compacta ? (
        <GradeMensal
          key={mesRefreshKey}
          onAgendar={setDataHoraNovaAula}
          unidadeConsultaId={unidadeConsultaId ? Number(unidadeConsultaId) : undefined}
          apenasConsulta={apenasConsulta}
        />
      ) : loading ? (
        <Loading message="Carregando grade..." />
      ) : erro && itens.length === 0 ? (
        <ErrorMessage message={erro} onRetry={carregar} />
      ) : horarios.length === 0 ? (
        <EmptyState title="Nenhuma aula programada" description="Não há aulas programadas nesta semana." />
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
                              onClick={apenasConsulta ? undefined : () => navigate(`/turmas/${item.turmaId}`)}
                              disabled={apenasConsulta}
                            >
                              {item.turmaNome}
                            </button>
                          </Tooltip>
                        ))}

                        {itensDaCelula.length === 0 && !compacta && !apenasConsulta && (
                          <button
                            type="button"
                            className="grade-item-vazio"
                            aria-label={`Programar aula em ${dia.label} às ${horario}`}
                            onClick={() => abrirProgramar(dia.indice, horario)}
                          >
                            +
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={dataHoraNovaAula !== null}
        title="Programar Aula"
        onClose={() => setDataHoraNovaAula(null)}
      >
        {dataHoraNovaAula && (
          <ProgramarAulaForm
            key={dataHoraNovaAula}
            dataInicial={dataHoraNovaAula}
            loading={salvando}
            onSubmit={handleProgramar}
          />
        )}
      </Modal>
    </div>
  );
}
