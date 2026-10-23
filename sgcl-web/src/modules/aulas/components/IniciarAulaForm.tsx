import { useEffect, useState } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Select } from "../../../components/ui/Select";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { FormGrid } from "../../../components/ui/FormGrid";
import { FormGridItem } from "../../../components/ui/FormGridItem";

import type { Turma } from "../../turmas/types/turma";
import { TurmaService } from "../../turmas/services/TurmaService";
import type { Curriculo } from "../../curriculos/types/curriculo";
import { CurriculoService } from "../../curriculos/services/CurriculoService";

const iniciarAulaSchema = z.object({
  turmaId: z.string().min(1, "Selecione uma turma."),
  aulaCurriculoId: z.string().optional(),
  professor: z.string().optional(),
  observacoes: z.string().optional(),
});

export type IniciarAulaFormData = z.infer<typeof iniciarAulaSchema>;

interface IniciarAulaFormProps {
  loading?: boolean;
  onSubmit: (data: IniciarAulaFormData) => void;
}

export function IniciarAulaForm({ loading = false, onSubmit }: IniciarAulaFormProps) {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [curriculos, setCurriculos] = useState<Curriculo[]>([]);

  const methods = useForm<IniciarAulaFormData>({
    resolver: zodResolver(iniciarAulaSchema),
    defaultValues: {
      turmaId: "",
      aulaCurriculoId: "",
      professor: "",
      observacoes: "",
    },
  });

  const { register, handleSubmit, formState: { errors } } = methods;

  useEffect(() => {
    TurmaService.listar().then((data) => setTurmas(data.filter((t) => t.ativo)));
    CurriculoService.listar().then(setCurriculos);
  }, []);

  const turmaIdSelecionada = useWatch({ control: methods.control, name: "turmaId" });
  const turmaSelecionada = turmas.find((t) => String(t.id) === turmaIdSelecionada);

  const curriculoDaTurma = turmaSelecionada?.curriculoId
    ? curriculos.find((c) => c.id === turmaSelecionada.curriculoId)
    : undefined;

  const opcoesAulaCurriculo = curriculoDaTurma
    ? curriculoDaTurma.modulos.flatMap((modulo) =>
        modulo.aulas.map((aula) => ({
          label: `${modulo.nome} — ${aula.titulo}`,
          value: String(aula.id),
        }))
      )
    : [];

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormGrid columns={1}>
          <FormGridItem>
            <Select
              label="Turma"
              options={turmas.map((turma) => ({ label: turma.nome, value: String(turma.id) }))}
              {...register("turmaId")}
            />
            <ErrorMessage message={errors.turmaId?.message ?? ""} />
          </FormGridItem>

          {curriculoDaTurma && (
            <FormGridItem>
              <Select
                label={`Aula do Currículo (${curriculoDaTurma.nome})`}
                options={opcoesAulaCurriculo}
                {...register("aulaCurriculoId")}
              />
            </FormGridItem>
          )}

          <FormGridItem>
            <Input label="Professor" {...register("professor")} />
          </FormGridItem>

          <FormGridItem>
            <Input label="Observações" {...register("observacoes")} />
          </FormGridItem>
        </FormGrid>

        <Button type="submit" disabled={loading}>
          {loading ? "Iniciando..." : "Iniciar Aula"}
        </Button>
      </form>
    </FormProvider>
  );
}
