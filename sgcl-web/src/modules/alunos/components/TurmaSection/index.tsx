import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

import { FormSection } from "../../../../components/ui/FormSection";
import { Select } from "../../../../components/ui/Select";

import { TurmaService } from "../../../turmas/services/TurmaService";
import type { Turma } from "../../../turmas/types/turma";

import type { AlunoFormData } from "../../schema/aluno.schema";

export function TurmaSection() {
  const { register } =
    useFormContext<AlunoFormData>();

  const [turmas, setTurmas] = useState<Turma[]>([]);

  useEffect(() => {
    async function carregar() {
      const data = await TurmaService.listar();
      setTurmas(data.filter((t) => t.ativo));
    }

    carregar();
  }, []);

  return (
    <FormSection
      title="Turma"
      subtitle="Turma em que o aluno está matriculado."
    >
      <Select
        label="Turma"

        options={[
          {
            label: "Selecione...",
            value: "",
          },

          ...turmas.map((turma) => {
            const ocupacao = turma.limiteAlunos
              ? ` (${turma._count?.alunos ?? 0}/${turma.limiteAlunos} vagas)`
              : "";

            return {
              label: `${turma.nome}${ocupacao}`,
              value: turma.id.toString(),
            };
          }),
        ]}

        {...register("turmaId")}
      />
    </FormSection>
  );
}