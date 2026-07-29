import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";
import { Button } from "../../../components/ui/Button";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { FormGrid } from "../../../components/ui/FormGrid";
import { FormGridItem } from "../../../components/ui/FormGridItem";

import { modeloContratoSchema, type ModeloContratoFormData } from "../schema/modeloContrato.schema";
import { VARIAVEIS_CONTRATO, type ModeloContrato } from "../types";
import "./styles.css";

interface ModeloContratoFormProps {
  modelo?: ModeloContrato;
  loading?: boolean;
  onSubmit: (data: ModeloContratoFormData) => void;
}

export function ModeloContratoForm({ modelo, loading = false, onSubmit }: ModeloContratoFormProps) {
  const methods = useForm<ModeloContratoFormData>({
    resolver: zodResolver(modeloContratoSchema),
    defaultValues: {
      nome: modelo?.nome ?? "",
      conteudo: modelo?.conteudo ?? "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = methods;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormGrid columns={1}>
          <FormGridItem>
            <Input label="Nome do modelo" {...register("nome")} />
            <ErrorMessage message={errors.nome?.message ?? ""} />
          </FormGridItem>

          <FormGridItem>
            <Textarea label="Conteúdo do contrato" rows={12} {...register("conteudo")} />
            <ErrorMessage message={errors.conteudo?.message ?? ""} />
          </FormGridItem>

          <FormGridItem>
            <div className="modelo-contrato-variaveis">
              <strong>Variáveis disponíveis:</strong>
              <ul>
                {VARIAVEIS_CONTRATO.map((variavel) => (
                  <li key={variavel.chave}>
                    <code>{`{{${variavel.chave}}}`}</code> — {variavel.descricao}
                  </li>
                ))}
              </ul>
            </div>
          </FormGridItem>
        </FormGrid>

        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : modelo ? "Salvar Alterações" : "Cadastrar Modelo"}
        </Button>
      </form>
    </FormProvider>
  );
}
