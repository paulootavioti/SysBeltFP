import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMensalidades } from "../hooks/useMensalidades";
import { MensalidadeService } from "../services/MensalidadeService";
import { MensalidadeCard } from "../components/MensalidadeCard";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";
import { calcularStatusMensalidade } from "../utils/status";



export function ListarMensalidades() {
  const navigate = useNavigate();
  const { mensalidades, loading, erro, setErro, carregarMensalidades } = useMensalidades();
  const [filtro, setFiltro] = useState<"TODAS" | "PENDENTE" | "VENCIDA" | "PAGA">("TODAS");
  const [busca, setBusca] = useState("");

  const mensalidadesFiltradas = mensalidades
    .filter((m) => {
      const status = calcularStatusMensalidade(m);
      if (filtro === "TODAS") return true;
      return status === filtro;
    })
    .filter((m) =>
      m.aluno?.nome.toLowerCase().includes(busca.toLowerCase())
    );

  async function handleMarcarComoPago(id: number) {
    try {
      setErro("");
      await MensalidadeService.marcarComoPago(id);
      await carregarMensalidades();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao marcar como pago."));
    }
  }

  const totalPendente = mensalidades
    .filter((m) => !m.pago)
    .reduce((sum, m) => sum + m.valor, 0);

  const totalPago = mensalidades
    .filter((m) => m.pago)
    .reduce((sum, m) => sum + m.valor, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mensalidades</h1>
          <p className="text-gray-600">Gestão de mensalidades dos alunos</p>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-gray-600 text-sm font-medium">Total Pendente</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              R$ {totalPendente.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-gray-600 text-sm font-medium">Total Recebido</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              R$ {totalPago.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-gray-600 text-sm font-medium">Total Geral</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              R$ {(totalPendente + totalPago).toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>

        {/* Controles */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Buscar por nome do aluno..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => navigate("/mensalidades/novo")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition"
            >
              + Nova Mensalidade
            </button>
          </div>

          {/* Filtros */}
          <div className="flex gap-2 flex-wrap">
            {(["TODAS", "PENDENTE", "VENCIDA", "PAGA"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filtro === f
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Mensagens */}
        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {erro}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <p className="text-gray-600">Carregando mensalidades...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && mensalidadesFiltradas.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Nenhuma mensalidade encontrada</p>
          </div>
        )}

        {/* Lista */}
        {!loading && mensalidadesFiltradas.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mensalidadesFiltradas.map((mensalidade) => (
              <MensalidadeCard
                key={mensalidade.id}
                mensalidade={mensalidade}
                onEditar={(id) => navigate(`/mensalidades/${id}`)}
                onMarcarComoPago={handleMarcarComoPago}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
