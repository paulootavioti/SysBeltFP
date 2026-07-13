import { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { FormGrid } from "../../../components/ui/FormGrid";
import { FormGridItem } from "../../../components/ui/FormGridItem";

import { moduloSchema, type ModuloFormData } from "../schema/curriculo.schema";

interface ModuloFormProps {
  loading?: boolean;
  initialValues?: Partial<ModuloFormData>;
  onSubmit: (data: ModuloFormData) => void;
}

export function ModuloForm({ loading = false, initialValues, onSubmit }: ModuloFormProps) {
  const methods = useForm<ModuloFormData>({
    resolver: zodResolver(moduloSchema),
    defaultValues: { nome: "", descricao: "", faixa: "", ...initialValues },
  });

  const { register, handleSubmit, formState: { errors } } = methods;

  useEffect(() => {
    methods.reset({ nome: "", descricao: "", faixa: "", ...initialValues });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues]);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormGrid columns={2}>
          <FormGridItem span={2}>
            <Input label="Nome do Módulo" {...register("nome")} />
            <ErrorMessage message={errors.nome?.message ?? ""} />
          </FormGridItem>

          <FormGridItem>
            <Input label="Faixa" {...register("faixa")} />
          </FormGridItem>

          <FormGridItem span={2}>
            <Input label="Descrição" {...register("descricao")} />
          </FormGridItem>
        </FormGrid>

        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : initialValues ? "Salvar Alterações" : "Cadastrar Módulo"}
        </Button>
      </form>
    </FormProvider>
  );
}