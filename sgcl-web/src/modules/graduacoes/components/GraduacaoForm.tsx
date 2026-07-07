import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select } from "../../../components/ui/Select";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { FormGrid } from "../../../components/ui/FormGrid";
import { FormGridItem } from "../../../components/ui/FormGridItem";
import type { Aluno } from "../../alunos/types";
import { AlunoService } from "../../alunos/services/AlunoService";
import { FAIXAS } from "../types";
import { graduacaoSchema, type GraduacaoFormData } from "../schema/graduacao.schema";
interface GraduacaoFormProps {
  loading?: boolean;
  onSubmit: (data: GraduacaoFormData) => void;
}
export function GraduacaoForm({ loading = false, onSubmit }: GraduacaoFormProps) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [carregandoAlunos, setCarregandoAlunos] = useState(true);
  const methods = useForm<GraduacaoFormData>({
    resolver: zodResolver(graduacaoSchema),
    defaultValues: {
      alunoId: "",
      faixa: "",
      data: new Date().toISOString().split("T")[0],
    },
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
        <FormGrid columns={2}>
          <FormGridItem>
            <Select
              label="Aluno"
              disabled={carregandoAlunos}
              options={alunos.map((aluno) => ({
                label: `${aluno.nome} - ${aluno.faixa}`,
                value: String(aluno.id),
              }))}
              {...register("alunoId")}
            />
            <ErrorMessage message={errors.alunoId?.message ?? ""} />
          </FormGridItem>
          <FormGridItem>
            <Select
              label="Nova Faixa"
              options={FAIXAS.map((faixa) => ({ label: faixa, value: faixa }))}
              {...register("faixa")}
            />
            <ErrorMessage message={errors.faixa?.message ?? ""} />
          </FormGridItem>
          <FormGridItem>
            <Input
              label="Data da Graduação"
              type="date"
              {...register("data")}
            />
            <ErrorMessage message={errors.data?.message ?? ""} />
          </FormGridItem>
        </FormGrid>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Registrar Graduação"}
        </Button>
      </form>
    </FormProvider>
  );
}