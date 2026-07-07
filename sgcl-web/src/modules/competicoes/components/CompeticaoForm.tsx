import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { FormGrid } from "../../../components/ui/FormGrid";
import { FormGridItem } from "../../../components/ui/FormGridItem";

import { competicaoSchema, type CompeticaoFormData } from "../schema/competicao.schema";

interface CompeticaoFormProps {
  loading?: boolean;
  onSubmit: (data: CompeticaoFormData) => void;
}

export function CompeticaoForm({ loading = false, onSubmit }: CompeticaoFormProps) {
  const methods = useForm<CompeticaoFormData>({
    resolver: zodResolver(competicaoSchema),
    defaultValues: { nome: "", data: "", local: "" },
  });

  const { register, handleSubmit, formState: { errors } } = methods;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormGrid columns={2}>
          <FormGridItem span={2}>
            <Input label="Nome da Competição" {...register("nome")} />
            <ErrorMessage message={errors.nome?.message ?? ""} />
          </FormGridItem>

          <FormGridItem>
            <Input label="Data" type="date" {...register("data")} />
            <ErrorMessage message={errors.data?.message ?? ""} />
          </FormGridItem>

          <FormGridItem>
            <Input label="Local" {...register("local")} />
            <ErrorMessage message={errors.local?.message ?? ""} />
          </FormGridItem>
        </FormGrid>

        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Cadastrar Competição"}
        </Button>
      </form>
    </FormProvider>
  );
}