import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Aluno } from "../../alunos/types";
import { AlunoService } from "../../alunos/services/AlunoService";
import { FAIXAS } from "../types";
import { graduacaoSchema, type GraduacaoFormData } from "../schema/graduacao.schema";

interface GraduacaoFormProps {
  loading?: boolean;
  onSubmit: (data: GraduacaoFormData) => void;
}

export function GraduacaoForm({ loading = false, onSubmit }: GraduacaoFormProps) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [carregandoAlunos, setCarregandoAlunos] = useState(true);

  const methods = useForm<GraduacaoFormData>({
    resolver: zodResolver(graduacaoSchema),
    defaultValues: {
      alunoId: "",
      faixa: "",
      data: new Date().toISOString().split("T")[0],
    },
  });

  const { register, handleSubmit, formState: { errors } } = methods;

  useEffect(() => {
    async function carregarAlunos() {
      try {
        const data = await AlunoService.listar();
        setAlunos(data.filter((a) => a.ativo));
      } finally {
        setCarregandoAlunos(false);
      }
    }
    carregarAlunos();
  }, []);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Aluno */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aluno
            </label>
            <select
              {...register("alunoId")}
              disabled={carregandoAlunos}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Selecione um aluno</option>
              {alunos.map((aluno) => (
                <option key={aluno.id} value={String(aluno.id)}>
                  {aluno.nome} - {aluno.faixa}
                </option>
              ))}
            </select>
            {errors.alunoId && (
              <p className="text-red-500 text-sm mt-1">{errors.alunoId.message}</p>
            )}
          </div>

          {/* Faixa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nova Faixa
            </label>
            <select
              {...register("faixa")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione a faixa</option>
              {FAIXAS.map((faixa) => (
                <option key={faixa} value={faixa}>
                  {faixa}
                </option>
              ))}
            </select>
            {errors.faixa && (
              <p className="text-red-500 text-sm mt-1">{errors.faixa.message}</p>
            )}
          </div>

          {/* Data */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data da Graduação
            </label>
            <input
              type="date"
              {...register("data")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.data && (
              <p className="text-red-500 text-sm mt-1">{errors.data.message}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition"
        >
          {loading ? "Salvando..." : "Registrar Graduação"}
        </button>
      </form>
    </FormProvider>
  );
}
