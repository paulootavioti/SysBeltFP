import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MensalidadeService } from "../../services/MensalidadeService";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage";
import { calcularStatusMensalidade, formatarStatusMensalidade, corStatusMensalidade } from "../../utils/status";
import type { MensalidadeComAluno } from "../../types";

function formatarData(data: string): string {
  return new Date(data).toLocaleDateString("pt-BR");
}

export function DetalheMensalidade() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mensalidade, setMensalidade] = useState<MensalidadeComAluno | null>(null);
  const [loading, setLoading] = useState(true);
  const [marcandoPago, setMarcandoPago] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarMensalidade() {
      try {
        if (!id) return;
        const data = await MensalidadeService.buscar(Number(id));
        setMensalidade(data);
      } catch (error) {
        setErro(getApiErrorMessage(error, "Erro ao carregar mensalidade."));
      } finally {
        setLoading(false);
      }
    }

    carregarMensalidade();
  }, [id]);

  async function handleMarcarComoPago() {
    try {
      if (!mensalidade) return;
      setMarcandoPago(true);
      setErro("");
      await MensalidadeService.marcarComoPago(mensalidade.id);
      
      // Recarregar dados
      const dados = await MensalidadeService.buscar(Number(id));
      setMensalidade(dados);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao marcar como pago."));
    } finally {
      setMarcandoPago(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

  if (erro && !mensalidade) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          <p>{erro}</p>
          <button
            onClick={() => navigate("/mensalidades")}
            className="mt-4 text-red-600 hover:text-red-800 underline"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  if (!mensalidade) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Mensalidade não encontrada</p>
      </div>
    );
  }

  const status = calcularStatusMensalidade(mensalidade);
  const statusFormatado = formatarStatusMensalidade(status);
  const corStatus = corStatusMensalidade(status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate("/mensalidades")}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Voltar
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Mensalidade - {mensalidade.aluno?.nome}
          </h1>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {erro}
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Header com status */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Detalhes</h2>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${corStatus}`}>
              {statusFormatado}
            </span>
          </div>

          {/* Conteúdo */}
          <div className="p-6 space-y-6">
            {/* Aluno */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Aluno</p>
                <p className="text-lg font-semibold text-gray-900">
                  {mensalidade.aluno?.nome}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Faixa</p>
                <p className="text-lg font-semibold text-gray-900">
                  {mensalidade.aluno?.faixa}
                </p>
              </div>
            </div>

            {/* Valor e Datas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 px-4 py-3 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Valor</p>
                <p className="text-2xl font-bold text-blue-600">
                  R$ {mensalidade.valor.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>

              <div className="bg-yellow-50 px-4 py-3 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Vencimento</p>
                <p className="font-semibold text-gray-900">
                  {formatarData(mensalidade.vencimento)}
                </p>
              </div>

              {mensalidade.dataPagamento && (
                <div className="bg-green-50 px-4 py-3 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Data de Pagamento</p>
                  <p className="font-semibold text-gray-900">
                    {formatarData(mensalidade.dataPagamento)}
                  </p>
                </div>
              )}
            </div>

            {/* ID */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">ID da Mensalidade: {mensalidade.id}</p>
            </div>
          </div>

          {/* Ações */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3">
            {!mensalidade.pago && status !== "PAGA" && (
              <button
                onClick={handleMarcarComoPago}
                disabled={marcandoPago}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                {marcandoPago ? "Marcando..." : "✓ Marcar como Pago"}
              </button>
            )}
            <button
              onClick={() => navigate("/mensalidades")}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-medium py-2 px-4 rounded-lg transition"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
