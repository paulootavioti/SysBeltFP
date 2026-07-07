import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Aluno } from "../../alunos/types";
import { AlunoService } from "../../alunos/services/AlunoService";
import { mensalidadeSchema, type MensalidadeFormData } from "../schema/mensalidade.schema";

interface MensalidadeFormProps {
  loading?: boolean;
  onSubmit: (data: MensalidadeFormData) => void;
  defaultValues?: Partial<MensalidadeFormData>;
}

export function MensalidadeForm({
  loading = false,
  onSubmit,
  defaultValues,
}: MensalidadeFormProps) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [carregandoAlunos, setCarregandoAlunos] = useState(true);

  const methods = useForm<MensalidadeFormData>({
    resolver: zodResolver(mensalidadeSchema),
    defaultValues: defaultValues || {
      alunoId: "",
      valor: "",
      vencimento: "",
      pago: false,
    },
  });

  const { register, handleSubmit, formState: { errors } } = methods;

  useEffect(() => {
    async function carregarAlunos() {
      try {
        const data = await AlunoService.listar();
        setAlunos(data.filter((a) => a.ativo)); // Apenas alunos ativos
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
                  {aluno.nome}
                </option>
              ))}
            </select>
            {errors.alunoId && (
              <p className="text-red-500 text-sm mt-1">{errors.alunoId.message}</p>
            )}
          </div>

          {/* Valor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor (R$)
            </label>
            <input
              type="number"
              step="0.01"
              {...register("valor")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0,00"
            />
            {errors.valor && (
              <p className="text-red-500 text-sm mt-1">{errors.valor.message}</p>
            )}
          </div>

          {/* Vencimento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de Vencimento
            </label>
            <input
              type="date"
              {...register("vencimento")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.vencimento && (
              <p className="text-red-500 text-sm mt-1">{errors.vencimento.message}</p>
            )}
          </div>

          {/* Data de Pagamento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de Pagamento
            </label>
            <input
              type="date"
              {...register("dataPagamento")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Pago */}
          <div className="flex items-center">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                {...register("pago")}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Marcado como Pago
              </span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition"
        >
          {loading ? "Salvando..." : "Salvar"}
        </button>
      </form>
    </FormProvider>
  );
}
