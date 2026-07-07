import type { AlunoElegivel } from "../types";
import { CORES_FAIXA } from "../types";

interface AlunoElegivelCardProps {
  aluno: AlunoElegivel;
  onPromover?: (id: number, faixa: string) => void;
}

export function AlunoElegivelCard({
  aluno,
  onPromover,
}: AlunoElegivelCardProps) {
  return (
    <div className="bg-white rounded-lg border-2 border-yellow-300 p-4 shadow-md">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{aluno.nome}</h3>
          <p className="text-sm text-gray-600">
            {aluno.presencas} aulas
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${CORES_FAIXA[aluno.faixa] || "bg-gray-400"}`}>
          {aluno.faixa}
        </div>
      </div>

      <div className="bg-yellow-50 px-3 py-2 rounded mb-3 text-sm">
        <p className="font-semibold text-yellow-900">
          ✓ Elegível para promoção!
        </p>
        <p className="text-yellow-800 text-xs">
          {aluno.presencas} ≥ 20 aulas
        </p>
      </div>

      <button
        onClick={() => onPromover?.(aluno.id, aluno.faixa)}
        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-3 rounded transition text-sm"
      >
        Promover
      </button>
    </div>
  );
}
