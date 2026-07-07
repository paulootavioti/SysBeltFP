import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Select } from "../../../components/ui/Select";
import { Button } from "../../../components/ui/Button";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";

import type { Aluno } from "../../alunos/types";
import { AlunoService } from "../../alunos/services/AlunoService";
import { inscricaoSchema, type InscricaoFormData } from "../schema/inscricao.schema";

interface InscricaoFormProps {
  loading?: boolean;
  onSubmit: (data: InscricaoFormData) => void;
}

export function InscricaoForm({ loading = false, onSubmit }: InscricaoFormProps) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [carregandoAlunos, setCarregandoAlunos] = useState(true);

  const methods = useForm<InscricaoFormData>({
    resolver: zodResolver(inscricaoSchema),
    defaultValues: { alunoId: "" },
  });

  const { register, handleSubmit, formState: { errors } } = methods;

  useEffect(() => {
    async function carregarAlunos() {
      try {
        const data = await AlunoService.listar();
        setAlunos(data.filter((a) => a.ativo));
      } finally {
        setCarregandoAlunos(false);
      }
    }
    carregarAlunos();
  }, []);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Select
          label="Aluno"
          disabled={carregandoAlunos}
          options={alunos.map((aluno) => ({ label: aluno.nome, value: String(aluno.id) }))}
          {...register("alunoId")}
        />
        <ErrorMessage message={errors.alunoId?.message ?? ""} />

        <Button type="submit" disabled={loading}>
          {loading ? "Inscrevendo..." : "Inscrever"}
        </Button>
      </form>
    </FormProvider>
  );
}