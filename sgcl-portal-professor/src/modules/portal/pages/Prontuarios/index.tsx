import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { SubHeader } from "../../../../components/ui/SubHeader";
import { Input } from "../../../../components/ui/Input";
import { Loading } from "../../../../components/ui/Loading";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { EmptyState } from "../../../../components/ui/EmptyState";

import { useMinhasTurmas } from "../../hooks/useMinhasTurmas";
import { useAlunosDoProfessor } from "../../hooks/useAlunosDoProfessor";

import "./styles.css";

export function Prontuarios() {
  const navigate = useNavigate();
  const { turmas, carregando: carregandoTurmas, erro: erroTurmas } = useMinhasTurmas();
  const { alunos, carregando: carregandoAlunos, erro: erroAlunos } = useAlunosDoProfessor(turmas);
  const [busca, setBusca] = useState("");

  const carregando = carregandoTurmas || carregandoAlunos;
  const erro = erroTurmas || erroAlunos;

  const alunosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return alunos;
    return alunos.filter((aluno) => aluno.nome.toLowerCase().includes(termo));
  }, [alunos, busca]);

  return (
    <div className="prontuarios-page">
      <SubHeader titulo="Prontuários" subtitulo="Ficha dos alunos" />

      <main className="prontuarios-conteudo">
        {carregando && <Loading message="Carregando alunos..." />}

        {!carregando && erro && <ErrorMessage message={erro} />}

        {!carregando && !erro && alunos.length === 0 && (
          <EmptyState
            title="Nenhum aluno encontrado"
            description="Você ainda não tem alunos vinculados às suas turmas."
          />
        )}

        {!carregando && !erro && alunos.length > 0 && (
          <>
            <Input
              placeholder="Buscar aluno pelo nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />

            <div className="prontuarios-lista">
              {alunosFiltrados.map((aluno) => (
                <button
                  key={aluno.id}
                  type="button"
                  className="prontuario-item"
                  onClick={() => navigate(`/prontuarios/${aluno.id}`)}
                >
                  <div>
                    <strong>{aluno.nome}</strong>
                    <span>
                      {aluno.faixa} · {aluno.turmaNome}
                    </span>
                  </div>
                  <span className="prontuario-item-seta" aria-hidden="true">
                    ›
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
