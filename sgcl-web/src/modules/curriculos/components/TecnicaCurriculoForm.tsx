import { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "../../../components/ui/Input";
import { Checkbox } from "../../../components/ui/Checkbox";
import { Button } from "../../../components/ui/Button";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { FormGrid } from "../../../components/ui/FormGrid";
import { FormGridItem } from "../../../components/ui/FormGridItem";

import { tecnicaCurriculoSchema, type TecnicaCurriculoFormData } from "../schema/curriculo.schema";
import { MemorandoPedagogico } from "./MemorandoPedagogico";

interface TecnicaCurriculoFormProps {
  loading?: boolean;
  initialValues?: Partial<TecnicaCurriculoFormData>;
  onSubmit: (data: TecnicaCurriculoFormData) => void;
}

export function TecnicaCurriculoForm({ loading = false, initialValues, onSubmit }: TecnicaCurriculoFormProps) {
  const methods = useForm<TecnicaCurriculoFormData>({
    resolver: zodResolver(tecnicaCurriculoSchema),
    defaultValues: { nome: "", categoria: "", descricao: "", obrigatoria: true, duracaoPrevistaMinutos: "10", ...initialValues },
  });

  const { register, handleSubmit, formState: { errors } } = methods;

  useEffect(() => {
    methods.reset({ nome: "", categoria: "", descricao: "", obrigatoria: true, duracaoPrevistaMinutos: "10", ...initialValues });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues]);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormGrid columns={2}>
          <FormGridItem span={2}>
            <Input label="Posição ou exercício" placeholder="Ex.: passagem de guarda em pé" {...register("nome")} />
            <ErrorMessage message={errors.nome?.message ?? ""} />
          </FormGridItem>

          <FormGridItem>
            <Input label="Categoria" placeholder="Ex.: queda, defesa, jogo de solo" {...register("categoria")} />
          </FormGridItem>

          <FormGridItem>
            <Checkbox label="Obrigatória" {...register("obrigatoria")} />
          </FormGridItem>

          <FormGridItem>
            <Input label="Duração prevista (min)" type="number" min="1" step="1" {...register("duracaoPrevistaMinutos")} />
            <ErrorMessage message={errors.duracaoPrevistaMinutos?.message ?? ""} />
          </FormGridItem>

          <FormGridItem span={2}>
            <MemorandoPedagogico label="Como conduzir" value={methods.watch("descricao") ?? ""} onChange={(value) => methods.setValue("descricao", value)} placeholder="Descreva demonstração, prática e critério para avançar." rows={4} sugestoes={["Demonstre lentamente, destaque os pontos de contato e convide perguntas.", "Organize duplas compatíveis e alterne os papéis a cada repetição.", "Interrompa para corrigir postura e retome apenas quando todos compreenderem."]} />
          </FormGridItem>
        </FormGrid>

        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : initialValues ? "Salvar Alterações" : "Cadastrar Técnica"}
        </Button>
      </form>
    </FormProvider>
  );
}
