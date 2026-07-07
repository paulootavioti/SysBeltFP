import type { Graduacao } from "../types";
import { CORES_FAIXA } from "../types";
import { formatarData } from "../utils/helpers";

interface TimelineGraduacoesProps {
  graduacoes: Graduacao[];
}

export function TimelineGraduacoes({ graduacoes }: TimelineGraduacoesProps) {
  const graduacoesOrdenadas = [...graduacoes].reverse();

  return (
    <div className="space-y-4">
      {graduacoesOrdenadas.length === 0 ? (
        <p className="text-center text-gray-500 py-8">Nenhuma graduação registrada</p>
      ) : (
        <div className="space-y-3">
          {graduacoesOrdenadas.map((grad, idx) => (
            <div key={grad.id} className="flex gap-4">
              {/* Timeline dot */}
              <div className="flex flex-col items-center">
                <div className={`w-4 h-4 rounded-full ${CORES_FAIXA[grad.faixa] || "bg-gray-400"} border-2 border-white shadow`} />
                {idx < graduacoesOrdenadas.length - 1 && (
                  <div className="w-1 h-12 bg-gray-300 my-2" />
                )}
              </div>

              {/* Content */}
              <div className="pb-2 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900">{grad.faixa}</h4>
                  <span className="text-sm text-gray-600">
                    {formatarData(grad.data)}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {idx === 0 ? "Faixa Atual" : `Conquistada há ${Math.floor((Date.now() - new Date(grad.data).getTime()) / (1000 * 60 * 60 * 24))} dias`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
