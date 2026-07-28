import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Select } from "../../../components/ui/Select";
import { Textarea } from "../../../components/ui/Textarea";
import { Button } from "../../../components/ui/Button";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { FormGrid } from "../../../components/ui/FormGrid";
import { FormGridItem } from "../../../components/ui/FormGridItem";

import { UsuarioService } from "../../usuarios/services/UsuarioService";
import type { ProfessorOpcao } from "../../usuarios/types/usuario";
import type { AulaProgramada } from "../types";

const transferirAulaSchema = z.object({
  professorSubstitutoId: z.string().min(1, "Selecione o professor substituto."),
  motivo: z.string().trim().min(1, "Informe o motivo do impedimento."),
});

export type TransferirAulaFormData = z.infer<typeof transferirAulaSchema>;

interface TransferirAulaFormProps {
  programacao: AulaProgramada;
  loading?: boolean;
  onSubmit: (data: TransferirAulaFormData) => void;
}

export function TransferirAulaForm({ programacao, loading = false, onSubmit }: TransferirAulaFormProps) {
  const [professores, setProfessores] = useState<ProfessorOpcao[]>([]);

  const methods = useForm<TransferirAulaFormData>({
    resolver: zodResolver(transferirAulaSchema),
    defaultValues: { professorSubstitutoId: "", motivo: "" },
  });

  const { register, handleSubmit, formState: { errors } } = methods;

  useEffect(() => {
    UsuarioService.listarProfessores().then(setProfessores);
  }, []);

  const professorTitularId = programacao.turma.professor?.id;
  const opcoesProfessores = professores
    .filter((professor) => professor.id !== professorTitularId)
    .map((professor) => ({ label: professor.apelido || professor.nome, value: String(professor.id) }));

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <p className="transferir-aula-info">
          Professor titular: {programacao.turma.professor?.apelido || programacao.turma.professor?.nome || "-"}
        </p>

        <FormGrid columns={1}>
          <FormGridItem>
            <Select
              label="Professor substituto"
              options={opcoesProfessores}
              {...register("professorSubstitutoId")}
            />
            <ErrorMessage message={errors.professorSubstitutoId?.message ?? ""} />
          </FormGridItem>

          <FormGridItem>
            <Textarea
              label="Motivo do impedimento"
              placeholder="Descreva o motivo pelo qual o professor titular não pode ministrar esta aula."
              {...register("motivo")}
            />
            <ErrorMessage message={errors.motivo?.message ?? ""} />
          </FormGridItem>
        </FormGrid>

        <Button type="submit" disabled={loading}>
          {loading ? "Transferindo..." : "Transferir Aula"}
        </Button>
      </form>
    </FormProvider>
  );
}
