import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";

import { arenaSchema, type ArenaFormData } from "../schema/arena.schema";
import type { Arena } from "../types/arena";

interface ArenaFormProps {
  arena?: Arena;
  loading?: boolean;
  onSubmit: (data: ArenaFormData) => void;
}

export function ArenaForm({ arena, loading = false, onSubmit }: ArenaFormProps) {
  const methods = useForm<ArenaFormData>({
    resolver: zodResolver(arenaSchema),
    defaultValues: {
      nome: arena?.nome ?? "",
      unidadeId: arena?.unidade ? String(arena.unidade.id) : "",
    },
  });

  const { register, handleSubmit, formState: { errors } } = methods;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Input label="Nome da Arena" placeholder="Ex: Tatame 1" {...register("nome")} />
        <ErrorMessage message={errors.nome?.message ?? ""} />

        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : arena ? "Salvar Alterações" : "Cadastrar Arena"}
        </Button>
      </form>
    </FormProvider>
  );
}
