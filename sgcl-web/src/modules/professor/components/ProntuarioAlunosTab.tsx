import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { Loading } from "../../../components/ui/Loading";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { EmptyState } from "../../../components/ui/EmptyState";

import { useAlunosDoProfessor } from "../hooks/useAlunosDoProfessor";
import type { Turma } from "../../turmas/types/turma";

interface ProntuarioAlunosTabProps {
  turmas: Turma[];
}

export function ProntuarioAlunosTab({ turmas }: ProntuarioAlunosTabProps) {
  const navigate = useNavigate();
  const { alunos, loading, erro } = useAlunosDoProfessor(turmas);
  const [busca, setBusca] = useState("");

  const alunosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return alunos;
    return alunos.filter((aluno) => aluno.nome.toLowerCase().includes(termo));
  }, [alunos, busca]);

  if (loading) return <Loading />;
  if (erro) return <ErrorMessage message={erro} />;

  if (alunos.length === 0) {
    return (
      <EmptyState
        title="Nenhum aluno encontrado"
        description="Você ainda não tem alunos vinculados às suas turmas."
      />
    );
  }

  return (
    <div className="professor-prontuario">
      <Input
        placeholder="Buscar aluno pelo nome..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      <div className="professor-prontuario-lista">
        {alunosFiltrados.map((aluno) => (
          <div key={aluno.id} className="professor-prontuario-item">
            <div>
              <strong>{aluno.nome}</strong>
              <span>
                {aluno.faixa} · {aluno.turmaNome}
              </span>
            </div>

            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => navigate(`/alunos/${aluno.id}/prontuario`)}
            >
              Ver prontuário
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
