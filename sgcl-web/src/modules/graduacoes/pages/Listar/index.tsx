import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGraduacoes } from "../../hooks/useGraduacoes";
import { GraduacaoService } from "../../services/GraduacaoService";
import { formatarData, getApiErrorMessage } from "../../utils/helpers";
import type { GraduacaoFormData } from "../../schema/graduacao.schema";
import { GraduacaoForm } from "../../components/GraduacaoForm";

export function ListarGraduacoes() {
  const navigate = useNavigate();
  const { graduacoes, loading, erro, setErro, carregarGraduacoes } = useGraduacoes();
  const [salvando, setSalvando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [busca, setBusca] = useState("");

  const graduacoesFiltradas = graduacoes.filter((g) =>
    g.aluno?.nome.toLowerCase().includes(busca.toLowerCase())
  );

  async function handleRegistrarGraduacao(data: GraduacaoFormData) {
    try {
      setSalvando(true);
      setErro("");
      await GraduacaoService.criar(data);
      await carregarGraduacoes();
      setMostrarForm(false);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao registrar graduação."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Graduações</h1>
          <p className="text-gray-600">Histórico de promoções e progressão de faixas</p>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {erro}
          </div>
        )}

        {/* Controles */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <input
              type="text"
              placeholder="Buscar por nome do aluno..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {!mostrarForm ? (
              <button
                onClick={() => setMostrarForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition"
              >
                + Registrar Graduação
              </button>
            ) : (
              <button
                onClick={() => setMostrarForm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-900 font-medium py-2 px-6 rounded-lg transition"
              >
                Cancelar
              </button>
            )}
          </div>

          {/* Formulário */}
          {mostrarForm && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <GraduacaoForm
                loading={salvando}
                onSubmit={handleRegistrarGraduacao}
              />
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <p className="text-gray-600">Carregando graduações...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && graduacoesFiltradas.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Nenhuma graduação encontrada</p>
          </div>
        )}

        {/* Lista */}
        {!loading && graduacoesFiltradas.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Aluno</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Faixa</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Data</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Tempo</th>
                </tr>
              </thead>
              <tbody>
                {graduacoesFiltradas.map((grad) => (
                  <tr
                    key={grad.id}
                    className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/alunos/${grad.alunoId}`)}
                  >
                    <td className="py-3 px-4">{grad.aluno?.nome}</td>
                    <td className="py-3 px-4 font-semibold">{grad.faixa}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatarData(grad.data)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {Math.floor((Date.now() - new Date(grad.data).getTime()) / (1000 * 60 * 60 * 24))} dias atrás
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
