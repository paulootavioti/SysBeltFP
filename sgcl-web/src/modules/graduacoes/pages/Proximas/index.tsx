import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduacaoService } from "../../services/GraduacaoService";
import type { AlunoElegivel } from "../../types";
import { AlunoElegivelCard } from "../../components/AlunoElegivelCard";
import { getApiErrorMessage } from "../../utils/helpers";
import { GraduacaoForm } from "../../components/GraduacaoForm";
import type { GraduacaoFormData } from "../../schema/graduacao.schema";

export function ProximasGraduacoes() {
  const navigate = useNavigate();
  const [alunos, setAlunos] = useState<AlunoElegivel[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<AlunoElegivel | null>(null);

  useEffect(() => {
    carregarProximas();
  }, []);

  async function carregarProximas() {
    try {
      setLoading(true);
      setErro("");
      const data = await GraduacaoService.listarProximas();
      setAlunos(data);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao carregar alunos elegíveis."));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegistrar(data: GraduacaoFormData) {
    try {
      setSalvando(true);
      setErro("");
      await GraduacaoService.criar(data);
      setAlunoSelecionado(null);
      await carregarProximas();
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
          <button
            onClick={() => navigate("/graduacoes")}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Voltar
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Próximas Graduações
          </h1>
          <p className="text-gray-600">
            Alunos elegíveis para promoção ({alunos.length})
          </p>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {erro}
          </div>
        )}

        {/* Modal de promoção */}
        {alunoSelecionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Promover {alunoSelecionado.nome}
              </h2>
              <GraduacaoForm
                loading={salvando}
                onSubmit={handleRegistrar}
              />
              <button
                onClick={() => setAlunoSelecionado(null)}
                className="w-full mt-4 bg-gray-300 hover:bg-gray-400 text-gray-900 font-medium py-2 px-4 rounded-lg transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <p className="text-gray-600">Carregando alunos elegíveis...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && alunos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Nenhum aluno elegível no momento
            </p>
            <p className="text-gray-400 text-sm">
              Alunos precisam de 20+ aulas
            </p>
          </div>
        )}

        {/* Grid */}
        {!loading && alunos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alunos.map((aluno) => (
              <AlunoElegivelCard
                key={aluno.id}
                aluno={aluno}
                onPromover={(id) => {
                  const a = alunos.find((x) => x.id === id);
                  if (a) setAlunoSelecionado(a);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
