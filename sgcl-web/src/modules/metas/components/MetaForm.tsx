import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Button } from "../../../components/ui/Button";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { FormGrid } from "../../../components/ui/FormGrid";
import { FormGridItem } from "../../../components/ui/FormGridItem";

import { metaSchema, type MetaFormData } from "../schema/meta.schema";
import type { MetaDashboard } from "../types";

const OPCOES_TIPO = [
  { value: "RECEITA", label: "Receita" },
  { value: "NOVAS_MATRICULAS", label: "Novas Matrículas" },
  { value: "ALUNOS_ATIVOS", label: "Alunos Ativos" },
  { value: "FREQUENCIA", label: "Frequência" },
  { value: "INADIMPLENCIA", label: "Redução da Inadimplência" },
  { value: "RETENCAO", label: "Retenção de Alunos" },
];

const OPCOES_FORMATO = [
  { value: "MOEDA", label: "Moeda (R$)" },
  { value: "QUANTIDADE", label: "Quantidade" },
  { value: "PERCENTUAL", label: "Percentual (%)" },
];

interface MetaFormProps {
  loading?: boolean;
  valoresIniciais?: MetaDashboard;
  onSubmit: (data: MetaFormData) => void;
}

export function MetaForm({ loading = false, valoresIniciais, onSubmit }: MetaFormProps) {
  const methods = useForm<MetaFormData>({
    resolver: zodResolver(metaSchema),
    defaultValues: {
      nome: valoresIniciais?.nome ?? "",
      tipo: valoresIniciais?.tipo ?? "RECEITA",
      valorMeta: valoresIniciais ? String(valoresIniciais.valorMeta) : "",
      formatoValor: valoresIniciais?.unidade ?? "MOEDA",
      dataLimite: valoresIniciais?.dataLimite.slice(0, 10) ?? "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = methods;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormGrid columns={2}>
          <FormGridItem span={2}>
            <Input label="Nome da Meta" {...register("nome")} />
            <ErrorMessage message={errors.nome?.message ?? ""} />
          </FormGridItem>

          <FormGridItem>
            <Select label="Tipo" options={OPCOES_TIPO} {...register("tipo")} />
            <ErrorMessage message={errors.tipo?.message ?? ""} />
          </FormGridItem>

          <FormGridItem>
            <Select label="Formato do Valor" options={OPCOES_FORMATO} {...register("formatoValor")} />
            <ErrorMessage message={errors.formatoValor?.message ?? ""} />
          </FormGridItem>

          <FormGridItem>
            <Input label="Valor da Meta" type="number" min={0} step="0.01" {...register("valorMeta")} />
            <ErrorMessage message={errors.valorMeta?.message ?? ""} />
          </FormGridItem>

          <FormGridItem>
            <Input label="Prazo" type="date" {...register("dataLimite")} />
            <ErrorMessage message={errors.dataLimite?.message ?? ""} />
          </FormGridItem>
        </FormGrid>

        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : valoresIniciais ? "Salvar Alterações" : "Criar Meta"}
        </Button>
      </form>
    </FormProvider>
  );
}
