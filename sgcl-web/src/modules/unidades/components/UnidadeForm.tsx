import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { FormGrid } from "../../../components/ui/FormGrid";
import { FormGridItem } from "../../../components/ui/FormGridItem";

import { unidadeSchema, type UnidadeFormData } from "../schema/unidade.schema";
import type { Unidade } from "../types/unidade";

interface UnidadeFormProps {
  unidade?: Unidade;
  loading?: boolean;
  onSubmit: (data: UnidadeFormData) => void;
}

export function UnidadeForm({ unidade, loading = false, onSubmit }: UnidadeFormProps) {
  const methods = useForm<UnidadeFormData>({
    resolver: zodResolver(unidadeSchema),
    defaultValues: {
      nome: unidade?.nome ?? "",
    },
  });

  const { register, handleSubmit, formState: { errors } } = methods;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormGrid columns={1}>
          <FormGridItem>
            <Input label="Nome da Unidade" placeholder="Ex: Academia Centro" {...register("nome")} />
            <ErrorMessage message={errors.nome?.message ?? ""} />
          </FormGridItem>
        </FormGrid>

        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : unidade ? "Salvar Alterações" : "Cadastrar Unidade"}
        </Button>
      </form>
    </FormProvider>
  );
}
