import { useNavigate } from "react-router-dom";
import { MensalidadeForm } from "../../components/MensalidadeForm";
import { MensalidadeService } from "../../services/MensalidadeService";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage";
import { useState } from "react";
import type { MensalidadeFormData } from "../../schema/mensalidade.schema";

export function NovaMensalidade() {
  const navigate = useNavigate();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSalvar(data: MensalidadeFormData) {
    try {
      setSalvando(true);
      setErro("");
      await MensalidadeService.criar(data);
      navigate("/mensalidades");
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao criar mensalidade."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate("/mensalidades")}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Voltar
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Nova Mensalidade</h1>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {erro}
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <MensalidadeForm loading={salvando} onSubmit={handleSalvar} />
        </div>
      </div>
    </div>
  );
}
