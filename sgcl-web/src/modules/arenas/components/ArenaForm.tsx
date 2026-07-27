import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Button } from "../../../components/ui/Button";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";

import { useAuth } from "../../../contexts/useAuth";
import type { Unidade } from "../../unidades/types/unidade";
import { UnidadeService } from "../../unidades/services/UnidadeService";

import { arenaSchema, type ArenaFormData } from "../schema/arena.schema";
import type { Arena } from "../types/arena";

interface ArenaFormProps {
  arena?: Arena;
  loading?: boolean;
  onSubmit: (data: ArenaFormData) => void;
}

export function ArenaForm({ arena, loading = false, onSubmit }: ArenaFormProps) {
  const { usuario } = useAuth();
  const ehSuperadmin = usuario?.perfil === "SUPERADMIN";
  const [unidades, setUnidades] = useState<Unidade[]>([]);

  const methods = useForm<ArenaFormData>({
    resolver: zodResolver(arenaSchema),
    defaultValues: {
      nome: arena?.nome ?? "",
      unidadeId: arena?.unidade ? String(arena.unidade.id) : "",
    },
  });

  const { register, handleSubmit, formState: { errors } } = methods;

  useEffect(() => {
    if (ehSuperadmin && !arena) {
      UnidadeService.listar().then((unidades) => setUnidades(unidades.filter((u) => u.ativo)));
    }
  }, [ehSuperadmin, arena]);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Input label="Nome da Arena" placeholder="Ex: Tatame 1" {...register("nome")} />
        <ErrorMessage message={errors.nome?.message ?? ""} />

        {ehSuperadmin && !arena && (
          <>
            <Select
              label="Unidade"
              options={unidades.map((unidade) => ({ label: unidade.nome, value: String(unidade.id) }))}
              {...register("unidadeId")}
            />
            <ErrorMessage message={errors.unidadeId?.message ?? ""} />
          </>
        )}

        {ehSuperadmin && arena?.unidade && (
          <p style={{ color: "var(--color-text-light)", marginBottom: "var(--space-4)" }}>
            Unidade: {arena.unidade.nome}
          </p>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : arena ? "Salvar Alterações" : "Cadastrar Arena"}
        </Button>
      </form>
    </FormProvider>
  );
}
