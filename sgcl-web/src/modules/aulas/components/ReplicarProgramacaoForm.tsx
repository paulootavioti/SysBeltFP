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
import { DiaSemanaSelector } from "../../../components/ui/DiaSemanaSelector";

import type { Turma } from "../../turmas/types/turma";
import { TurmaService } from "../../turmas/services/TurmaService";
import type { Curriculo } from "../../curriculos/types/curriculo";
import { CurriculoService } from "../../curriculos/services/CurriculoService";

const replicarProgramacaoSchema = z.object({
  turmaId: z.string().min(1, "Selecione uma turma."),
  aulaCurriculoId: z.string().optional(),
  dataInicio: z.string().min(1, "Informe a data inicial."),
  dataFim: z.string().min(1, "Informe a data final."),
  diasSemana: z.array(z.number()).min(1, "Selecione ao menos um dia da semana."),
  observacoes: z.string().optional(),
});

export type ReplicarProgramacaoFormData = z.infer<typeof replicarProgramacaoSchema>;

interface ReplicarProgramacaoFormProps {
  turmaIdInicial?: number;
  loading?: boolean;
  onSubmit: (data: ReplicarProgramacaoFormData) => void;
}

export function ReplicarProgramacaoForm({
  turmaIdInicial,
  loading = false,
  onSubmit,
}: ReplicarProgramacaoFormProps) {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [curriculos, setCurriculos] = useState<Curriculo[]>([]);

  const methods = useForm<ReplicarProgramacaoFormData>({
    resolver: zodResolver(replicarProgramacaoSchema),
    defaultValues: {
      turmaId: turmaIdInicial ? String(turmaIdInicial) : "",
      aulaCurriculoId: "",
      dataInicio: "",
      dataFim: "",
      diasSemana: [],
      observacoes: "",
    },
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = methods;

  useEffect(() => {
    TurmaService.listar().then((data) => setTurmas(data.filter((t) => t.ativo)));
    CurriculoService.listar().then(setCurriculos);
  }, []);

  const turmaIdSelecionada = watch("turmaId");
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

  const diasSelecionados = watch("diasSemana");

  // sugere os dias da própria turma ao selecioná-la — dados de agendamento
  // (dias da semana) e de turma estão diretamente relacionados, então não
  // faz sentido pedir pro usuário escolher de novo algo que já está
  // cadastrado. O usuário ainda pode ajustar manualmente depois.
  useEffect(() => {
    if (turmaSelecionada) {
      setValue("diasSemana", turmaSelecionada.diasSemana, { shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmaSelecionada?.id]);

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
                options={[{ label: "Nenhuma", value: "" }, ...opcoesAulaCurriculo]}
                {...register("aulaCurriculoId")}
              />
            </FormGridItem>
          )}

          <FormGridItem>
            <DiaSemanaSelector
              value={diasSelecionados || []}
              onChange={(dias) => setValue("diasSemana", dias, { shouldValidate: true })}
            />
            <ErrorMessage message={errors.diasSemana?.message ?? ""} />
          </FormGridItem>

          <FormGridItem>
            <Input label="Data Inicial" type="date" {...register("dataInicio")} />
            <ErrorMessage message={errors.dataInicio?.message ?? ""} />
          </FormGridItem>

          <FormGridItem>
            <Input label="Data Final" type="date" {...register("dataFim")} />
            <ErrorMessage message={errors.dataFim?.message ?? ""} />
          </FormGridItem>

          <FormGridItem>
            <Input label="Observações" {...register("observacoes")} />
          </FormGridItem>
        </FormGrid>

        <Button type="submit" disabled={loading}>
          {loading ? "Replicando..." : "Replicar Programação"}
        </Button>
      </form>
    </FormProvider>
  );
}
