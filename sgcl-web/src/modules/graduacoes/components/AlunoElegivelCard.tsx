import type { AlunoElegivel, EvolucaoAluno } from "../types";
import { CORES_FAIXA } from "../types";
import { Button } from "../../../components/ui/Button";
import { ProgressBar } from "./ProgressBar";
import "./AlunoElegivelCard.css";
interface AlunoElegivelCardProps {
  aluno: AlunoElegivel;
  onPromover?: (id: number, faixa: string) => void;
}

// ProgressBar espera o formato de EvolucaoAluno (mesmo componente usado no
// prontuário do aluno) — os campos numéricos já vêm calculados do backend
// pra esse mesmo aluno, só remontamos o formato aqui.
function paraEvolucao(aluno: AlunoElegivel): EvolucaoAluno {
  return {
    alunoId: aluno.alunoId,
    nome: aluno.nome,
    faixaAtual: aluno.faixa,
    grauAtual: aluno.grauAtual ?? 0,
    grauCalculado: aluno.grauAtual ?? 0,
    presencas: aluno.presencas,
    faltamParaProximoGrau: aluno.faltamParaProximoGrau ?? 0,
    faltamParaProximaFaixa: aluno.aulasRestantes ?? 0,
  };
}

export function AlunoElegivelCard({
  aluno,
  onPromover,
}: AlunoElegivelCardProps) {
  const corFaixa = CORES_FAIXA[aluno.faixa] ?? { background: "var(--text-light)", color: "#fff" };
  const apto = aluno.aptoGraduacao ?? true;

  return (
    <div className={`aluno-elegivel-card${apto ? "" : " aluno-elegivel-card-pendente"}`}>
      <div className="aluno-elegivel-header">
        <div>
          <h3>{aluno.nome}</h3>
          <p>{aluno.presencas} aulas</p>
        </div>
        <span className="aluno-elegivel-faixa" style={corFaixa}>
          {aluno.faixa}
        </span>
      </div>

      {apto && (
        <div className="aluno-elegivel-aviso">
          <p>✓ Elegível para promoção!</p>
          <span>{aluno.presencas} ≥ 8 aulas</span>
        </div>
      )}

      <ProgressBar evolucao={paraEvolucao(aluno)} />

      {apto && (
        <Button type="button" onClick={() => onPromover?.(aluno.alunoId, aluno.faixa)}>
          Promover
        </Button>
      )}
    </div>
  );
}