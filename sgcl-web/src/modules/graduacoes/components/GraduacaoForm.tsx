import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Select } from "../../../components/ui/Select";
import { Input } from "../../../components/ui/Input";
import { Checkbox } from "../../../components/ui/Checkbox";
import { Button } from "../../../components/ui/Button";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { FormGrid } from "../../../components/ui/FormGrid";
import { FormGridItem } from "../../../components/ui/FormGridItem";

import type { Aluno } from "../../alunos/types";
import { AlunoService } from "../../alunos/services/AlunoService";
import { calcularIdade, getFaixasDaTrilha } from "../types";
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
      tipo: "FAIXA",
      faixa: "",
      data: new Date().toISOString().split("T")[0],
      gerarCobranca: false,
      valorCobranca: "",
      vencimentoCobranca: "",
    },
  });

  const { register, handleSubmit, watch, formState: { errors } } = methods;

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

  const alunoIdSelecionado = watch("alunoId");
  const alunoSelecionado = alunos.find((a) => String(a.id) === alunoIdSelecionado);

  const tipoSelecionado = watch("tipo");
  const gerarCobranca = watch("gerarCobranca");

  const faixasDisponiveis = alunoSelecionado
    ? getFaixasDaTrilha(calcularIdade(alunoSelecionado.dataNascimento))
    : [];

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormGrid columns={2}>
          <FormGridItem>
            <Select
              label="Aluno"
              disabled={carregandoAlunos}
              options={alunos.map((aluno) => ({
                label: `${aluno.nome} - ${aluno.faixa} (grau ${aluno.grau})`,
                value: String(aluno.id),
              }))}
              {...register("alunoId")}
            />
            <ErrorMessage message={errors.alunoId?.message ?? ""} />
          </FormGridItem>

          <FormGridItem>
            <Select
              label="Tipo de Graduação"
              options={[
                { label: "Troca de Faixa", value: "FAIXA" },
                { label: "Grau", value: "GRAU" },
              ]}
              {...register("tipo")}
            />
          </FormGridItem>

          {tipoSelecionado === "FAIXA" && (
            <FormGridItem>
              <Select
                label="Nova Faixa"
                disabled={!alunoSelecionado}
                options={faixasDisponiveis.map((faixa) => ({ label: faixa, value: faixa }))}
                {...register("faixa")}
              />
              <ErrorMessage message={errors.faixa?.message ?? ""} />
            </FormGridItem>
          )}

          <FormGridItem>
            <Input label="Data da Graduação" type="date" {...register("data")} />
            <ErrorMessage message={errors.data?.message ?? ""} />
          </FormGridItem>

          <FormGridItem span={2}>
            <Checkbox label="Gerar cobrança para esta graduação" {...register("gerarCobranca")} />
          </FormGridItem>

          {gerarCobranca && (
            <>
              <FormGridItem>
                <Input label="Valor da Cobrança (R$)" type="number" step="0.01" {...register("valorCobranca")} />
                <ErrorMessage message={errors.valorCobranca?.message ?? ""} />
              </FormGridItem>

              <FormGridItem>
                <Input label="Vencimento da Cobrança" type="date" {...register("vencimentoCobranca")} />
                <ErrorMessage message={errors.vencimentoCobranca?.message ?? ""} />
              </FormGridItem>
            </>
          )}
        </FormGrid>

        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Registrar Graduação"}
        </Button>
      </form>
    </FormProvider>
  );
}
