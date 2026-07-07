import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Checkbox } from "../../../components/ui/Checkbox";
import { Button } from "../../../components/ui/Button";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { FormGrid } from "../../../components/ui/FormGrid";
import { FormGridItem } from "../../../components/ui/FormGridItem";
import type { Aluno } from "../../alunos/types";
import { AlunoService } from "../../alunos/services/AlunoService";
import { mensalidadeSchema, type MensalidadeFormData } from "../schema/mensalidade.schema";
interface MensalidadeFormProps {
  loading?: boolean;
  onSubmit: (data: MensalidadeFormData) => void;
  defaultValues?: Partial<MensalidadeFormData>;
}
export function MensalidadeForm({
  loading = false,
  onSubmit,
  defaultValues,
}: MensalidadeFormProps) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [carregandoAlunos, setCarregandoAlunos] = useState(true);
  const methods = useForm<MensalidadeFormData>({
    resolver: zodResolver(mensalidadeSchema),
    defaultValues: defaultValues || {
      alunoId: "",
      valor: "",
      vencimento: "",
      pago: false,
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
                label: aluno.nome,
                value: String(aluno.id),
              }))}
              {...register("alunoId")}
            />
            <ErrorMessage message={errors.alunoId?.message ?? ""} />
          </FormGridItem>
          <FormGridItem>
            <Input
              label="Valor (R$)"
              type="number"
              step="0.01"
              placeholder="0,00"
              {...register("valor")}
            />
            <ErrorMessage message={errors.valor?.message ?? ""} />
          </FormGridItem>
          <FormGridItem>
            <Input
              label="Data de Vencimento"
              type="date"
              {...register("vencimento")}
            />
            <ErrorMessage message={errors.vencimento?.message ?? ""} />
          </FormGridItem>
          <FormGridItem>
            <Input
              label="Data de Pagamento"
              type="date"
              {...register("dataPagamento")}
            />
          </FormGridItem>
          <FormGridItem span={2}>
            <Checkbox
              label="Marcado como Pago"
              {...register("pago")}
            />
          </FormGridItem>
        </FormGrid>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar"}
        </Button>
      </form>
    </FormProvider>
  );
}