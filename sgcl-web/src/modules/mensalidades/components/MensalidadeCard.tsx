import type { MensalidadeComAluno } from "../types";
import { calcularStatusMensalidade, formatarStatusMensalidade, corStatusMensalidade } from "../utils/status";

function formatarData(data: string): string {
  return new Date(data).toLocaleDateString("pt-BR");
}

interface MensalidadeCardProps {
  mensalidade: MensalidadeComAluno;
  onEditar?: (id: number) => void;
  onMarcarComoPago?: (id: number) => void;
}

export function MensalidadeCard({
  mensalidade,
  onEditar,
  onMarcarComoPago,
}: MensalidadeCardProps) {
  const status = calcularStatusMensalidade(mensalidade);
  const statusFormatado = formatarStatusMensalidade(status);
  const corStatus = corStatusMensalidade(status);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{mensalidade.aluno?.nome}</h3>
          <p className="text-sm text-gray-500">Faixa: {mensalidade.aluno?.faixa}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${corStatus}`}>
          {statusFormatado}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Valor:</span>
          <span className="font-semibold">
            R$ {mensalidade.valor.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Vencimento:</span>
          <span className="text-sm">
            {formatarData(mensalidade.vencimento)}
          </span>
        </div>
        {mensalidade.dataPagamento && (
          <div className="flex justify-between">
            <span className="text-gray-600">Pagamento:</span>
            <span className="text-sm">
              {formatarData(mensalidade.dataPagamento)}
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-3 border-t">
        {!mensalidade.pago && status !== "PAGA" && (
          <button
            onClick={() => onMarcarComoPago?.(mensalidade.id)}
            className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 font-medium py-1 px-2 rounded text-sm transition"
          >
            ✓ Marcar como Pago
          </button>
        )}
        <button
          onClick={() => onEditar?.(mensalidade.id)}
          className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-1 px-2 rounded text-sm transition"
        >
          Ver Detalhes
        </button>
      </div>
    </div>
  );
}
