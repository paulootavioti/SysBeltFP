import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Button } from "../../../components/ui/Button";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { FormGrid } from "../../../components/ui/FormGrid";
import { FormGridItem } from "../../../components/ui/FormGridItem";

import { TIPO_FORMA_PAGAMENTO_LABEL, type FormaPagamento } from "../types";
import { formaPagamentoSchema, type FormaPagamentoFormData } from "../schema/formaPagamento.schema";

const OPCOES_TIPO = Object.entries(TIPO_FORMA_PAGAMENTO_LABEL).map(([value, label]) => ({ value, label }));

interface FormaPagamentoFormProps {
  formaPagamento?: FormaPagamento;
  loading?: boolean;
  onSubmit: (data: FormaPagamentoFormData) => void;
}

export function FormaPagamentoForm({ formaPagamento, loading = false, onSubmit }: FormaPagamentoFormProps) {
  const methods = useForm<FormaPagamentoFormData>({
    resolver: zodResolver(formaPagamentoSchema),
    defaultValues: {
      tipo: formaPagamento?.tipo ?? "PIX",
      nomePersonalizado: formaPagamento?.nomePersonalizado ?? "",
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = methods;

  const tipoSelecionado = watch("tipo");

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormGrid columns={2}>
          <FormGridItem span={2}>
            <Select label="Tipo" options={OPCOES_TIPO} {...register("tipo")} />
            <ErrorMessage message={errors.tipo?.message ?? ""} />
          </FormGridItem>

          {tipoSelecionado === "OUTRO" && (
            <FormGridItem span={2}>
              <Input label="Nome da Forma de Pagamento" placeholder="Ex: Vale-treino" {...register("nomePersonalizado")} />
              <ErrorMessage message={errors.nomePersonalizado?.message ?? ""} />
            </FormGridItem>
          )}
        </FormGrid>

        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : formaPagamento ? "Salvar Alterações" : "Cadastrar Forma de Pagamento"}
        </Button>
      </form>
    </FormProvider>
  );
}
