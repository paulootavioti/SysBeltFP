import type { AlunoElegivel } from "../types";
import { CORES_FAIXA } from "../types";
import { Button } from "../../../components/ui/Button";
import "./AlunoElegivelCard.css";
interface AlunoElegivelCardProps {
  aluno: AlunoElegivel;
  onPromover?: (id: number, faixa: string) => void;
}
export function AlunoElegivelCard({
  aluno,
  onPromover,
}: AlunoElegivelCardProps) {
  const corFaixa = CORES_FAIXA[aluno.faixa] ?? { background: "var(--text-light)", color: "#fff" };
  return (
    <div className="aluno-elegivel-card">
      <div className="aluno-elegivel-header">
        <div>
          <h3>{aluno.nome}</h3>
          <p>{aluno.presencas} aulas</p>
        </div>
        <span className="aluno-elegivel-faixa" style={corFaixa}>
          {aluno.faixa}
        </span>
      </div>
      <div className="aluno-elegivel-aviso">
        <p>✓ Elegível para promoção!</p>
        <span>{aluno.presencas} ≥ 20 aulas</span>
      </div>
      <Button type="button" onClick={() => onPromover?.(aluno.id, aluno.faixa)}>
        Promover
      </Button>
    </div>
  );
}