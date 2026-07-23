import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Select } from "../../../components/ui/Select";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { FormGrid } from "../../../components/ui/FormGrid";
import { FormGridItem } from "../../../components/ui/FormGridItem";

import type { Curriculo } from "../../curriculos/types/curriculo";
import { CurriculoService } from "../../curriculos/services/CurriculoService";
import type { AulaProgramada } from "../types";

const editarProgramacaoSchema = z.object({
  aulaCurriculoId: z.string().optional(),
  data: z.string().min(1, "Informe a data e horário."),
  observacoes: z.string().optional(),
});

export type EditarProgramacaoFormData = z.infer<typeof editarProgramacaoSchema>;

interface EditarProgramacaoFormProps {
  programacao: AulaProgramada;
  loading?: boolean;
  onSubmit: (data: EditarProgramacaoFormData) => void;
}

function paraDatetimeLocal(data: string): string {
  const iso = new Date(data).toISOString();
  return iso.slice(0, 16);
}

export function EditarProgramacaoForm({ programacao, loading = false, onSubmit }: EditarProgramacaoFormProps) {
  const [curriculos, setCurriculos] = useState<Curriculo[]>([]);

  const methods = useForm<EditarProgramacaoFormData>({
    resolver: zodResolver(editarProgramacaoSchema),
    defaultValues: {
      aulaCurriculoId: programacao.aulaCurriculoId ? String(programacao.aulaCurriculoId) : "",
      data: paraDatetimeLocal(programacao.data),
      observacoes: programacao.observacoes ?? "",
    },
  });

  const { register, handleSubmit, formState: { errors } } = methods;

  useEffect(() => {
    CurriculoService.listar().then(setCurriculos);
  }, []);

  const opcoesAulaCurriculo = curriculos.flatMap((curriculo) =>
    curriculo.modulos.flatMap((modulo) =>
      modulo.aulas.map((aula) => ({
        label: `${curriculo.nome} — ${modulo.nome} — ${aula.titulo}`,
        value: String(aula.id),
      }))
    )
  );

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormGrid columns={1}>
          <FormGridItem>
            <Select
              label="Aula do Currículo"
              options={[{ label: "Nenhuma", value: "" }, ...opcoesAulaCurriculo]}
              {...register("aulaCurriculoId")}
            />
          </FormGridItem>

          <FormGridItem>
            <Input label="Data e Horário" type="datetime-local" {...register("data")} />
            <ErrorMessage message={errors.data?.message ?? ""} />
          </FormGridItem>

          <FormGridItem>
            <Input label="Observações" {...register("observacoes")} />
          </FormGridItem>
        </FormGrid>

        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </form>
    </FormProvider>
  );
}
