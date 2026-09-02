import { useEffect } from "react";
import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";
import { Button } from "../../../components/ui/Button";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { FormGrid } from "../../../components/ui/FormGrid";
import { FormGridItem } from "../../../components/ui/FormGridItem";
import { Select } from "../../../components/ui/Select";

import { aulaCurriculoSchema, type AulaCurriculoFormData } from "../schema/curriculo.schema";

interface AulaCurriculoFormProps {
  loading?: boolean;
  initialValues?: Partial<AulaCurriculoFormData>;
  onSubmit: (data: AulaCurriculoFormData) => void;
}

const AULA_DEFAULTS: AulaCurriculoFormData = {
  titulo: "",
  objetivo: "",
  descricao: "",
  duracaoMinutos: "",
  jogosSugeridos: "",
  blocos: [],
};

const TIPOS_BLOCO = [
  { value: "AQUECIMENTO", label: "Aquecimento" },
  { value: "JOGO", label: "Jogo" },
  { value: "SPARRING", label: "Sparring" },
  { value: "PAUSA", label: "Pausa" },
  { value: "ALONGAMENTO", label: "Alongamento" },
] as const;

export function AulaCurriculoForm({ loading = false, initialValues, onSubmit }: AulaCurriculoFormProps) {
  const methods = useForm<AulaCurriculoFormData>({
    resolver: zodResolver(aulaCurriculoSchema),
    defaultValues: { ...AULA_DEFAULTS, ...initialValues },
  });

  const { register, handleSubmit, formState: { errors } } = methods;
  const { fields, append, remove } = useFieldArray({ control: methods.control, name: "blocos" });
  const blocos = methods.watch("blocos") ?? [];

  useEffect(() => {
    methods.reset({ ...AULA_DEFAULTS, ...initialValues });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues]);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormGrid columns={2}>
          <FormGridItem span={2}>
            <Input label="Título da Aula" {...register("titulo")} />
            <ErrorMessage message={errors.titulo?.message ?? ""} />
          </FormGridItem>

          <FormGridItem span={2}>
            <Input label="Objetivo" {...register("objetivo")} />
          </FormGridItem>

          <FormGridItem>
            <Input label="Duração (minutos)" type="number" {...register("duracaoMinutos")} />
          </FormGridItem>

          <FormGridItem span={2}>
            <Textarea label="Jogos Sugeridos" {...register("jogosSugeridos")} />
          </FormGridItem>

          <FormGridItem span={2}>
            <Textarea label="Descrição" {...register("descricao")} />
          </FormGridItem>
        </FormGrid>

        <section className="curriculo-blocos-editor" aria-labelledby="titulo-blocos-aula">
          <div className="curriculo-blocos-cabecalho">
            <div>
              <h3 id="titulo-blocos-aula">Blocos cronometrados</h3>
              <p>Defina a ordem e o tempo dos jogos, pausas e rounds.</p>
            </div>
            <Button type="button" variant="secondary" onClick={() => append({ tipo: "AQUECIMENTO", nome: "", duracaoMinutos: "5", rounds: "4", duracaoRoundMinutos: "4", descansoSegundos: "60", anuncio: "" })}>
              Adicionar bloco
            </Button>
          </div>

          {fields.map((field, index) => {
            const tipo = blocos[index]?.tipo;
            return (
              <div className="curriculo-bloco-linha" key={field.id}>
                <Select label="Tipo" options={TIPOS_BLOCO} {...register(`blocos.${index}.tipo`)} />
                <Input label="Nome" {...register(`blocos.${index}.nome`)} />
                <Input label={tipo === "SPARRING" ? "Duração do round (min)" : "Duração (min)"} type="number" min="1" {...register(tipo === "SPARRING" ? `blocos.${index}.duracaoRoundMinutos` : `blocos.${index}.duracaoMinutos`)} />
                {tipo === "SPARRING" && <Input label="Rounds" type="number" min="1" {...register(`blocos.${index}.rounds`)} />}
                {tipo === "SPARRING" && <Input label="Descanso (s)" type="number" min="0" {...register(`blocos.${index}.descansoSegundos`)} />}
                {tipo === "PAUSA" && <Input label="Anúncio" {...register(`blocos.${index}.anuncio`)} />}
                <Button type="button" variant="danger" onClick={() => remove(index)}>Remover</Button>
              </div>
            );
          })}
        </section>

        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : initialValues ? "Salvar Alterações" : "Cadastrar Aula"}
        </Button>
      </form>
    </FormProvider>
  );
}
