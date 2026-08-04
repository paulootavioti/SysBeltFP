import type { AulaAlunoDetalhe } from "../../../types";
import "./Etapa1Presenca.css";

interface Etapa1PresencaProps {
  alunos: AulaAlunoDetalhe[];
  onTogglePresenca: (alunoId: number, presente: boolean) => void;
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const primeiras = [partes[0], partes[partes.length - 1]].filter(Boolean);
  return primeiras.map((parte) => parte[0]?.toUpperCase() ?? "").join("");
}

export function Etapa1Presenca({ alunos, onTogglePresenca }: Etapa1PresencaProps) {
  const presentes = alunos.filter((registro) => registro.presente).length;
  const total = alunos.length;
  const percentual = total === 0 ? 0 : Math.round((presentes / total) * 100);
  const todosMarcados = total > 0 && presentes === total;

  function handleTodosOuLimpar() {
    const novoValor = !todosMarcados;
    alunos.forEach((registro) => {
      if (registro.presente !== novoValor) {
        onTogglePresenca(registro.alunoId, novoValor);
      }
    });
  }

  return (
    <div className="etapa-presenca">
      <div className="etapa-presenca-resumo">
        <div className="etapa-presenca-resumo-topo">
          <strong>
            {presentes} de {total} presentes
          </strong>
          <button type="button" className="etapa-presenca-todos" onClick={handleTodosOuLimpar}>
            {todosMarcados ? "Limpar" : "Todos"}
          </button>
        </div>
        <div className="etapa-presenca-barra">
          <div className="etapa-presenca-barra-preenchida" style={{ width: `${percentual}%` }} />
        </div>
      </div>

      <div className="etapa-presenca-lista">
        {alunos.map((registro) => (
          <button
            key={registro.id}
            type="button"
            className={`etapa-presenca-linha${registro.presente ? " etapa-presenca-linha-marcada" : ""}`}
            onClick={() => onTogglePresenca(registro.alunoId, !registro.presente)}
          >
            <span className="etapa-presenca-avatar">{iniciais(registro.aluno.nome)}</span>

            <span className="etapa-presenca-info">
              <strong>{registro.aluno.apelido || registro.aluno.nome}</strong>
              <span>
                {registro.aluno.faixa} · frequência {registro.frequenciaMes}%
              </span>
            </span>

            <span className="etapa-presenca-check" aria-hidden="true">
              {registro.presente && "✓"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
