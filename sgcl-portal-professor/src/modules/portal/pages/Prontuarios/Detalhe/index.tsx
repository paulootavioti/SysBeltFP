import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { SubHeader } from "../../../../../components/ui/SubHeader";
import { Loading } from "../../../../../components/ui/Loading";
import { ErrorMessage } from "../../../../../components/ui/ErrorMessage";

import { AcademicoService } from "../../../services/AcademicoService";
import { getApiErrorMessage } from "../../../../../utils/getApiErrorMessage";
import type { ProntuarioProfessor } from "../../../types-academico";

import "./styles.css";

function corPorPercentual(percentual: number) {
  if (percentual >= 80) return "prontuario-freq-verde";
  if (percentual >= 60) return "prontuario-freq-ambar";
  return "prontuario-freq-vermelho";
}

function formatarData(data: string) {
  return new Date(data).toLocaleDateString("pt-BR");
}

const ROTULOS_COMPORTAMENTO: Record<string, string> = {
  respeito: "Respeito",
  valentia: "Valentia",
  esforco: "Esforço",
  atencao: "Atenção",
  disciplina: "Disciplina",
};

export function ProntuarioDetalhe() {
  const { alunoId } = useParams<{ alunoId: string }>();
  const navigate = useNavigate();

  const [dados, setDados] = useState<ProntuarioProfessor | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!alunoId) return;

    setCarregando(true);
    setErro("");

    AcademicoService.prontuario(Number(alunoId))
      .then(setDados)
      .catch((error) => setErro(getApiErrorMessage(error, "Não foi possível carregar o prontuário.")))
      .finally(() => setCarregando(false));
  }, [alunoId]);

  return (
    <div className="prontuario-detalhe-page">
      <SubHeader
        titulo={dados?.aluno.apelido || dados?.aluno.nome || "Prontuário"}
        subtitulo={dados?.turma?.nome}
        aoVoltar={() => navigate("/prontuarios")}
      />

      <main className="prontuario-detalhe-conteudo">
        {carregando && <Loading message="Carregando prontuário..." />}

        {!carregando && erro && <ErrorMessage message={erro} />}

        {!carregando && !erro && dados && (
          <>
            <div className={`prontuario-freq-card ${corPorPercentual(dados.resumo.frequencia)}`}>
              <strong>{dados.resumo.frequencia}%</strong>
              <span>Frequência geral</span>
              <span className="prontuario-freq-detalhe">
                {dados.resumo.totalPresencas} de {dados.resumo.totalAulas} aulas
              </span>
            </div>

            <section className="prontuario-secao">
              <h3>Graduação atual</h3>
              <p className="prontuario-graduacao-atual">
                {dados.resumo.faixa} · grau {dados.resumo.grau}
              </p>
              <p className="prontuario-graduacao-info">
                Faltam {dados.resumo.proximoGrauEm} presença{dados.resumo.proximoGrauEm === 1 ? "" : "s"} pro próximo
                grau.
              </p>
            </section>

            <section className="prontuario-secao">
              <h3>Comportamento (contagem de aulas)</h3>
              <div className="prontuario-comportamento-grid">
                {Object.entries(dados.comportamento).map(([chave, valor]) => (
                  <div key={chave} className="prontuario-comportamento-item">
                    <strong>{valor}</strong>
                    <span>{ROTULOS_COMPORTAMENTO[chave] ?? chave}</span>
                  </div>
                ))}
              </div>
            </section>

            {dados.comportamentoRegistros.length > 0 && (
              <section className="prontuario-secao">
                <h3>Observações registradas</h3>
                <div className="prontuario-registros">
                  {dados.comportamentoRegistros.map((registro) => (
                    <div key={registro.id} className="prontuario-registro-item">
                      <span className="prontuario-registro-data">{formatarData(registro.data)}</span>
                      {registro.observacao && <p>{registro.observacao}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="prontuario-secao">
              <h3>Responsáveis</h3>
              {dados.responsaveis.length === 0 ? (
                <p className="prontuario-vazio">Nenhum responsável cadastrado.</p>
              ) : (
                <ul className="prontuario-lista-simples">
                  {dados.responsaveis.map((responsavel) => (
                    <li key={responsavel.id}>
                      {responsavel.nome} <span>({responsavel.parentesco})</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="prontuario-secao">
              <h3>Histórico de graduações</h3>
              {dados.graduacoes.length === 0 ? (
                <p className="prontuario-vazio">Nenhuma graduação registrada.</p>
              ) : (
                <ul className="prontuario-lista-simples">
                  {dados.graduacoes.map((graduacao) => (
                    <li key={graduacao.id}>
                      {graduacao.faixa} <span>— {formatarData(graduacao.data)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
