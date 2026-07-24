import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

import { FormSection } from "../../../../components/ui/FormSection";
import { Select } from "../../../../components/ui/Select";

import { TurmaService } from "../../../turmas/services/TurmaService";
import type { Turma } from "../../../turmas/types/turma";

import type { AlunoFormData } from "../../schema/aluno.schema";

export function TurmaSection() {
  const { register, watch } =
    useFormContext<AlunoFormData>();

  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    async function carregar() {
      const data = await TurmaService.listar();
      setTurmas(data);
      setCarregado(true);
    }

    carregar();
  }, []);

  const turmaIdAtual = watch("turmaId");

  // turmas ativas + a turma atual do aluno, mesmo que ela tenha sido inativada
  // (senão o select perde silenciosamente o vínculo já existente)
  const turmasSelecionaveis = turmas.filter(
    (turma) => turma.ativo || turma.id.toString() === turmaIdAtual
  );

  return (
    <FormSection
      title="Turma"
      subtitle="Turma em que o aluno está matriculado."
    >
      <Select
        key={carregado ? "turma-carregada" : "turma-carregando"}
        label="Turma"

        options={[
          {
            label: "Selecione...",
            value: "",
          },

          ...turmasSelecionaveis.map((turma) => {
            const ocupacao = turma.limiteAlunos
              ? ` (${turma._count?.alunos ?? 0}/${turma.limiteAlunos} vagas)`
              : "";

            return {
              label: `${turma.nome}${ocupacao}${turma.ativo ? "" : " (inativa)"}`,
              value: turma.id.toString(),
            };
          }),
        ]}

        {...register("turmaId")}
      />
    </FormSection>
  );
}
