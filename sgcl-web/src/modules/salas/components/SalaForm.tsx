import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";

import { salaSchema, type SalaFormData } from "../schema/sala.schema";
import type { Sala } from "../types/sala";

interface SalaFormProps {
  sala?: Sala;
  loading?: boolean;
  onSubmit: (data: SalaFormData) => void;
}

export function SalaForm({ sala, loading = false, onSubmit }: SalaFormProps) {
  const methods = useForm<SalaFormData>({
    resolver: zodResolver(salaSchema),
    defaultValues: {
      nome: sala?.nome ?? "",
    },
  });

  const { register, handleSubmit, formState: { errors } } = methods;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Input label="Nome da Sala" placeholder="Ex: Tatame 1" {...register("nome")} />
        <ErrorMessage message={errors.nome?.message ?? ""} />

        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : sala ? "Salvar Alterações" : "Cadastrar Sala"}
        </Button>
      </form>
    </FormProvider>
  );
}
