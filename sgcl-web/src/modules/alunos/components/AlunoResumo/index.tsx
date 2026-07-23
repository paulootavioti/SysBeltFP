import { calcularIdade } from "../../../../shared/formatters/data";
import { StatusBadge } from "../../../../components/ui/StatusBadge";
import { AuthenticatedImage } from "../../../../components/ui/AuthenticatedImage";
import { calcularStatusFinanceiroAluno } from "../../utils/statusFinanceiro";

import type { AlunoCompleto } from "../../types/alunoCompleto";

import "./styles.css";

interface AlunoResumoProps {
  aluno: AlunoCompleto;
}

export function AlunoResumo({ aluno }: AlunoResumoProps) {
  const idade = calcularIdade(aluno.dataNascimento);
  const statusFinanceiro = calcularStatusFinanceiroAluno(aluno.mensalidades);

  return (
    <section className="aluno-resumo">
      <div className="aluno-resumo-avatar">
        <span>{aluno.nome.charAt(0)}</span>
        {aluno.fotoUrl && (
          <AuthenticatedImage src={aluno.fotoUrl} alt={aluno.nome} />
        )}
      </div>

      <div className="aluno-resumo-info">
        <div className="aluno-resumo-header">
          <h2>{aluno.nome}</h2>

          <div className="aluno-resumo-badges">
            <StatusBadge status={aluno.ativo ? "ATIVO" : "INATIVO"} />
            {statusFinanceiro && <StatusBadge status={statusFinanceiro} />}
          </div>
        </div>

        <p>
          {idade !== null ? `${idade} anos` : "Idade não informada"}
          {" • "}
          Faixa {aluno.faixa}
          {" • "}
          Grau {aluno.grau}
        </p>

        <div className="aluno-resumo-details">
          <span>
            <strong>Telefone:</strong> {aluno.telefone || "-"}
          </span>

          <span>
            <strong>WhatsApp:</strong> {aluno.whatsapp || "-"}
          </span>

          <span>
            <strong>Turma:</strong> {aluno.turma?.nome || "Não vinculada"}
          </span>
        </div>
      </div>
    </section>
  );
}