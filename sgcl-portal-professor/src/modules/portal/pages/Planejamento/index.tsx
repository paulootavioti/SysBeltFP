import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { SubHeader } from "../../../../components/ui/SubHeader";
import { Loading } from "../../../../components/ui/Loading";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { EmptyState } from "../../../../components/ui/EmptyState";

import { useMinhasTurmas } from "../../hooks/useMinhasTurmas";
import { AcademicoService } from "../../services/AcademicoService";
import { getApiErrorMessage } from "../../../../utils/getApiErrorMessage";
import type { Curriculo } from "../../types-academico";

import "./styles.css";

export function Planejamento() {
  const [searchParams] = useSearchParams();
  const { turmas, carregando: carregandoTurmas } = useMinhasTurmas();

  const [curriculos, setCurriculos] = useState<Curriculo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [curriculoId, setCurriculoId] = useState("");

  useEffect(() => {
    AcademicoService.listarCurriculos()
      .then(setCurriculos)
      .catch((error) => setErro(getApiErrorMessage(error, "Não foi possível carregar o planejamento pedagógico.")))
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => {
    if (turmas.length === 0) return;

    const turmaIdParam = searchParams.get("turma");
    const turma = turmaIdParam
      ? turmas.find((item) => String(item.id) === turmaIdParam)
      : turmas[0];

    if (turma?.curriculoId) {
      setCurriculoId(String(turma.curriculoId));
    }
  }, [turmas, searchParams]);

  const opcoesTurma = turmas.filter((turma) => turma.curriculoId);
  const curriculoSelecionado = curriculos.find((curriculo) => String(curriculo.id) === curriculoId);

  return (
    <div className="planejamento-page">
      <SubHeader titulo="Planejamento" subtitulo="Currículo (leitura)" />

      <main className="planejamento-conteudo">
        {(carregando || carregandoTurmas) && <Loading message="Carregando currículo..." />}

        {!carregando && !carregandoTurmas && erro && <ErrorMessage message={erro} />}

        {!carregando && !carregandoTurmas && !erro && (
          <>
            {opcoesTurma.length > 1 && (
              <label className="planejamento-select">
                <span>Turma</span>
                <select value={curriculoId} onChange={(e) => setCurriculoId(e.target.value)}>
                  {opcoesTurma.map((turma) => (
                    <option key={turma.id} value={String(turma.curriculoId)}>
                      {turma.nome}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {!curriculoSelecionado ? (
              <EmptyState
                title="Nenhum currículo vinculado"
                description="Suas turmas ainda não têm um currículo de planejamento vinculado."
              />
            ) : (
              <div className="planejamento-curriculo">
                <h2>{curriculoSelecionado.nome}</h2>
                <p className="planejamento-curriculo-info">
                  {curriculoSelecionado.modalidade} — {curriculoSelecionado.publico}
                </p>

                {curriculoSelecionado.modulos.length === 0 ? (
                  <p className="planejamento-vazio">Nenhum módulo cadastrado.</p>
                ) : (
                  curriculoSelecionado.modulos
                    .sort((a, b) => a.ordem - b.ordem)
                    .map((modulo) => (
                      <details key={modulo.id} className="modulo-card">
                        <summary>
                          <span>{modulo.nome}</span>
                          {modulo.faixa && <span className="modulo-card-faixa">{modulo.faixa}</span>}
                        </summary>

                        {modulo.descricao && <p className="modulo-card-descricao">{modulo.descricao}</p>}

                        {modulo.aulas
                          .sort((a, b) => a.ordem - b.ordem)
                          .map((aula) => (
                            <details key={aula.id} className="aula-card">
                              <summary>{aula.titulo}</summary>

                              {aula.objetivo && <p className="aula-card-objetivo">{aula.objetivo}</p>}

                              {aula.tecnicas.length > 0 && (
                                <ul className="aula-card-tecnicas">
                                  {aula.tecnicas
                                    .sort((a, b) => a.ordem - b.ordem)
                                    .map((tecnica) => (
                                      <li key={tecnica.id}>{tecnica.nome}</li>
                                    ))}
                                </ul>
                              )}
                            </details>
                          ))}
                      </details>
                    ))
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
