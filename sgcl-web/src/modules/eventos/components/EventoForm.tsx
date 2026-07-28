import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Textarea } from "../../../components/ui/Textarea";
import { Button } from "../../../components/ui/Button";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { FormGrid } from "../../../components/ui/FormGrid";
import { FormGridItem } from "../../../components/ui/FormGridItem";

import { eventoSchema, type EventoFormData } from "../schema/evento.schema";
import { TIPO_EVENTO_LABEL, STATUS_EVENTO_LABEL, type Evento } from "../types";

const OPCOES_TIPO = Object.entries(TIPO_EVENTO_LABEL).map(([value, label]) => ({ value, label }));
const OPCOES_STATUS = Object.entries(STATUS_EVENTO_LABEL).map(([value, label]) => ({ value, label }));

interface EventoFormProps {
  loading?: boolean;
  valoresIniciais?: Evento;
  onSubmit: (data: EventoFormData) => void;
}

function paraInputDate(dataIso?: string): string {
  if (!dataIso) return "";
  return dataIso.slice(0, 10);
}

function paraInputNumero(valor?: number): string {
  return valor === undefined ? "" : String(valor);
}

export function EventoForm({ loading = false, valoresIniciais, onSubmit }: EventoFormProps) {
  const methods = useForm<EventoFormData>({
    resolver: zodResolver(eventoSchema),
    defaultValues: {
      titulo: valoresIniciais?.titulo ?? "",
      descricao: valoresIniciais?.descricao ?? "",
      tipo: valoresIniciais?.tipo ?? "SEMINARIO",
      status: valoresIniciais?.status ?? "RASCUNHO",
      dataInicio: paraInputDate(valoresIniciais?.dataInicio) || new Date().toISOString().slice(0, 10),
      dataFim: paraInputDate(valoresIniciais?.dataFim),
      local: valoresIniciais?.local ?? "",
      metaParticipantes: paraInputNumero(valoresIniciais?.metaParticipantes),
      participantesConfirmados: paraInputNumero(valoresIniciais?.participantesConfirmados),
      investimento: paraInputNumero(valoresIniciais?.investimento),
      receitaGerada: paraInputNumero(valoresIniciais?.receitaGerada),
      responsavel: valoresIniciais?.responsavel ?? "",
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
        <FormGrid columns={2}>
          <FormGridItem span={2}>
            <Input label="Título" {...register("titulo")} />
            <ErrorMessage message={errors.titulo?.message ?? ""} />
          </FormGridItem>

          <FormGridItem span={2}>
            <Textarea label="Descrição" {...register("descricao")} />
          </FormGridItem>

          <FormGridItem>
            <Select label="Tipo" options={OPCOES_TIPO} {...register("tipo")} />
            <ErrorMessage message={errors.tipo?.message ?? ""} />
          </FormGridItem>

          <FormGridItem>
            <Select label="Status" options={OPCOES_STATUS} {...register("status")} />
            <ErrorMessage message={errors.status?.message ?? ""} />
          </FormGridItem>

          <FormGridItem>
            <Input label="Data de Início" type="date" {...register("dataInicio")} />
            <ErrorMessage message={errors.dataInicio?.message ?? ""} />
          </FormGridItem>

          <FormGridItem>
            <Input label="Data de Fim" type="date" {...register("dataFim")} />
          </FormGridItem>

          <FormGridItem>
            <Input label="Local" {...register("local")} />
          </FormGridItem>

          <FormGridItem>
            <Input label="Responsável" {...register("responsavel")} />
          </FormGridItem>

          <FormGridItem>
            <Input label="Meta de Participantes" type="number" min={0} {...register("metaParticipantes")} />
          </FormGridItem>

          <FormGridItem>
            <Input
              label="Participantes Confirmados"
              type="number"
              min={0}
              {...register("participantesConfirmados")}
            />
          </FormGridItem>

          <FormGridItem>
            <Input label="Investimento (R$)" type="number" min={0} step="0.01" {...register("investimento")} />
          </FormGridItem>

          <FormGridItem>
            <Input label="Receita Gerada (R$)" type="number" min={0} step="0.01" {...register("receitaGerada")} />
          </FormGridItem>
        </FormGrid>

        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : valoresIniciais ? "Salvar Alterações" : "Criar Evento"}
        </Button>
      </form>
    </FormProvider>
  );
}
