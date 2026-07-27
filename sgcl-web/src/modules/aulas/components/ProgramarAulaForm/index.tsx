import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Select } from "../../../../components/ui/Select";
import { Input } from "../../../../components/ui/Input";
import { Button } from "../../../../components/ui/Button";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { FormGrid } from "../../../../components/ui/FormGrid";
import { FormGridItem } from "../../../../components/ui/FormGridItem";
import { DiaSemanaSelector } from "../../../../components/ui/DiaSemanaSelector";

import type { Turma } from "../../../turmas/types/turma";
import { TurmaService } from "../../../turmas/services/TurmaService";
import type { Curriculo } from "../../../curriculos/types/curriculo";
import { CurriculoService } from "../../../curriculos/services/CurriculoService";

import "./styles.css";

const programarAulaSchema = z
  .object({
    modo: z.enum(["unica", "recorrente"]),
    turmaId: z.string().min(1, "Selecione uma turma."),
    aulaCurriculoId: z.string().optional(),
    observacoes: z.string().optional(),
    data: z.string().optional(),
    dataInicio: z.string().optional(),
    dataFim: z.string().optional(),
    diasSemana: z.array(z.number()).optional(),
  })
  .superRefine((valores, ctx) => {
    if (valores.modo === "unica") {
      if (!valores.data) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["data"], message: "Informe a data e horário." });
      }
      return;
    }

    if (!valores.dataInicio) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dataInicio"], message: "Informe a data inicial." });
    }
    if (!valores.dataFim) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dataFim"], message: "Informe a data final." });
    }
    if (!valores.diasSemana || valores.diasSemana.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["diasSemana"],
        message: "Selecione ao menos um dia da semana.",
      });
    }
  });

export type ProgramarAulaFormData = z.infer<typeof programarAulaSchema>;

interface ProgramarAulaFormProps {
  turmaIdInicial?: number;
  dataInicial?: string;
  loading?: boolean;
  onSubmit: (data: ProgramarAulaFormData) => void;
}

export function ProgramarAulaForm({
  turmaIdInicial,
  dataInicial,
  loading = false,
  onSubmit,
}: ProgramarAulaFormProps) {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [curriculos, setCurriculos] = useState<Curriculo[]>([]);

  const methods = useForm<ProgramarAulaFormData>({
    resolver: zodResolver(programarAulaSchema),
    defaultValues: {
      modo: "unica",
      turmaId: turmaIdInicial ? String(turmaIdInicial) : "",
      aulaCurriculoId: "",
      observacoes: "",
      data: dataInicial ?? "",
      dataInicio: "",
      dataFim: "",
      diasSemana: [],
    },
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = methods;

  useEffect(() => {
    TurmaService.listar().then((data) => setTurmas(data.filter((t) => t.ativo)));
    CurriculoService.listar().then(setCurriculos);
  }, []);

  const modo = watch("modo");
  const turmaIdSelecionada = watch("turmaId");
  const turmaSelecionada = turmas.find((t) => String(t.id) === turmaIdSelecionada);
  const diasSelecionados = watch("diasSemana");

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

  // sugere os dias da própria turma ao entrar no modo recorrente — dados de
  // agendamento (dias da semana) e de turma estão diretamente relacionados,
  // então não faz sentido pedir pro usuário escolher de novo algo que já
  // está cadastrado. O usuário ainda pode ajustar manualmente depois.
  useEffect(() => {
    if (modo === "recorrente" && turmaSelecionada) {
      setValue("diasSemana", turmaSelecionada.diasSemana, { shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmaSelecionada?.id, modo]);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="programar-aula-modo" role="group" aria-label="Tipo de programação">
          <button
            type="button"
            className={`programar-aula-modo-opcao${modo === "unica" ? " active" : ""}`}
            aria-pressed={modo === "unica"}
            onClick={() => setValue("modo", "unica")}
          >
            Aula única
          </button>
          <button
            type="button"
            className={`programar-aula-modo-opcao${modo === "recorrente" ? " active" : ""}`}
            aria-pressed={modo === "recorrente"}
            onClick={() => setValue("modo", "recorrente")}
          >
            Recorrente
          </button>
        </div>

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

          {modo === "unica" ? (
            <FormGridItem>
              <Input label="Data e Horário" type="datetime-local" {...register("data")} />
              <ErrorMessage message={errors.data?.message ?? ""} />
            </FormGridItem>
          ) : (
            <>
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
            </>
          )}

          <FormGridItem>
            <Input label="Observações" {...register("observacoes")} />
          </FormGridItem>
        </FormGrid>

        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : modo === "unica" ? "Programar Aula" : "Replicar Programação"}
        </Button>
      </form>
    </FormProvider>
  );
}
