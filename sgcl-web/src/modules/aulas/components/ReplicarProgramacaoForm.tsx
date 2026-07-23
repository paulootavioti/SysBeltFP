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

import type { Turma } from "../../turmas/types/turma";
import { TurmaService } from "../../turmas/services/TurmaService";
import type { Curriculo } from "../../curriculos/types/curriculo";
import { CurriculoService } from "../../curriculos/services/CurriculoService";

import "./ReplicarProgramacaoForm.css";

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

const DIAS_SEMANA = [
  { indice: 1, label: "Seg" },
  { indice: 2, label: "Ter" },
  { indice: 3, label: "Qua" },
  { indice: 4, label: "Qui" },
  { indice: 5, label: "Sex" },
  { indice: 6, label: "Sáb" },
  { indice: 0, label: "Dom" },
];

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

  function alternarDia(indice: number) {
    const atual = diasSelecionados || [];
    const novo = atual.includes(indice) ? atual.filter((d) => d !== indice) : [...atual, indice];
    setValue("diasSemana", novo, { shouldValidate: true });
  }

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
            <label className="replicar-programacao-label">Dias da semana</label>
            <div className="replicar-programacao-dias">
              {DIAS_SEMANA.map((dia) => (
                <button
                  key={dia.indice}
                  type="button"
                  className={
                    diasSelecionados?.includes(dia.indice)
                      ? "replicar-programacao-dia active"
                      : "replicar-programacao-dia"
                  }
                  onClick={() => alternarDia(dia.indice)}
                >
                  {dia.label}
                </button>
              ))}
            </div>
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
