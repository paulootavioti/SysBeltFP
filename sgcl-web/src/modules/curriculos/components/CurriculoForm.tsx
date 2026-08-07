import { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Button } from "../../../components/ui/Button";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { FormGrid } from "../../../components/ui/FormGrid";
import { FormGridItem } from "../../../components/ui/FormGridItem";

import { useModalidades } from "../../modalidades/hooks/useModalidades";

import { curriculoSchema, type CurriculoFormData } from "../schema/curriculo.schema";

interface CurriculoFormProps {
  loading?: boolean;
  initialValues?: Partial<CurriculoFormData>;
  onSubmit: (data: CurriculoFormData) => void;
}

export function CurriculoForm({ loading = false, initialValues, onSubmit }: CurriculoFormProps) {
  // só ativas viram opção — currículo antigo mantém a modalidade que tem.
  const { modalidades } = useModalidades(true);

  const methods = useForm<CurriculoFormData>({
    resolver: zodResolver(curriculoSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      modalidadeId: "",
      publico: "Kids",
      ...initialValues,
    },
  });

  const { register, handleSubmit, formState: { errors } } = methods;

  useEffect(() => {
    methods.reset({
      nome: "",
      descricao: "",
      modalidadeId: "",
      publico: "Kids",
      ...initialValues,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues]);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormGrid columns={2}>
          <FormGridItem span={2}>
            <Input label="Nome do Currículo" {...register("nome")} />
            <ErrorMessage message={errors.nome?.message ?? ""} />
          </FormGridItem>

          <FormGridItem>
            <Select
              label="Modalidade"
              options={[
                { label: "Sem modalidade", value: "" },
                ...modalidades.map((m) => ({ label: m.nome, value: String(m.id) })),
              ]}
              {...register("modalidadeId")}
            />
          </FormGridItem>

          <FormGridItem>
            <Input label="Público" {...register("publico")} />
          </FormGridItem>

          <FormGridItem span={2}>
            <Input label="Descrição" {...register("descricao")} />
          </FormGridItem>
        </FormGrid>

        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : initialValues ? "Salvar Alterações" : "Cadastrar Currículo"}
        </Button>
      </form>
    </FormProvider>
  );
}