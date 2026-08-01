import { useNavigate } from "react-router-dom";

import { useAuth } from "../../../../contexts/useAuth";
import { Button } from "../../../../components/ui/Button";
import { Tabs } from "../../../../components/ui/Tabs";
import { EmptyState } from "../../../../components/ui/EmptyState";

import { ResumoTab } from "../../components/ResumoTab";
import { FrequenciaTab } from "../../components/FrequenciaTab";
import { MensalidadesTab } from "../../components/MensalidadesTab";
import { AgendaTab } from "../../components/AgendaTab";
import { MensagensTab } from "../../components/MensagensTab";

import "./styles.css";

export function Portal() {
  const navigate = useNavigate();
  const { usuario, alunos, alunoSelecionadoId, selecionarAluno, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="portal-page">
      <header className="portal-header">
        <div>
          <h1>Portal da Família</h1>
          <p>Olá, {usuario?.nome}</p>
        </div>

        <Button type="button" variant="secondary" onClick={handleLogout}>
          Sair
        </Button>
      </header>

      {alunos.length > 1 && (
        <div className="portal-chips">
          {alunos.map((aluno) => (
            <button
              key={aluno.id}
              type="button"
              className={`portal-chip${aluno.id === alunoSelecionadoId ? " portal-chip-ativo" : ""}`}
              onClick={() => selecionarAluno(aluno.id)}
            >
              <span className="portal-chip-iniciais">{aluno.iniciais}</span>
              {aluno.apelido || aluno.nome}
            </button>
          ))}
        </div>
      )}

      {!alunoSelecionadoId ? (
        <EmptyState title="Nenhum aluno vinculado" description="Fale com a academia para vincular um aluno à sua conta." />
      ) : (
        <Tabs
          key={alunoSelecionadoId}
          tabs={[
            { value: "resumo", label: "Resumo", content: <ResumoTab alunoId={alunoSelecionadoId} /> },
            { value: "frequencia", label: "Frequência", content: <FrequenciaTab alunoId={alunoSelecionadoId} /> },
            { value: "mensalidades", label: "Mensalidades", content: <MensalidadesTab alunoId={alunoSelecionadoId} /> },
            { value: "agenda", label: "Agenda", content: <AgendaTab alunoId={alunoSelecionadoId} /> },
            { value: "mensagens", label: "Mensagens", content: <MensagensTab alunoId={alunoSelecionadoId} /> },
          ]}
        />
      )}
    </div>
  );
}
