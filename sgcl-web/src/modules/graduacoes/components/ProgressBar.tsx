import type { EvolucaoAluno } from "../types";

interface ProgressBarProps {
  evolucao: EvolucaoAluno;
}

export function ProgressBar({ evolucao }: ProgressBarProps) {
  const percentualGrau =
    ((evolucao.presencas % 32) / 8) * 25;
  const percentualFaixa =
    (evolucao.presencas % 32) / 32 * 100;

  return (
    <div className="space-y-4">
      {/* Faixa Atual */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-700">Faixa Atual</p>
          <p className="text-sm text-gray-600">{evolucao.presencas} aulas</p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300"
            style={{ width: `${percentualFaixa}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Faltam {evolucao.faltamParaProximaFaixa} aulas para próxima faixa
        </p>
      </div>

      {/* Grau Atual */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-700">
            Progresso no Grau
          </p>
          <p className="text-sm text-gray-600">
            Grau {evolucao.grauAtual + 1} de 4
          </p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-green-600 h-full transition-all duration-300"
            style={{ width: `${percentualGrau}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Faltam {evolucao.faltamParaProximoGrau} aulas para próximo grau
        </p>
      </div>
    </div>
  );
}
