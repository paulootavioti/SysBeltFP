import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Button } from "../../../components/ui/Button";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { FormGrid } from "../../../components/ui/FormGrid";
import { FormGridItem } from "../../../components/ui/FormGridItem";

import {
  CREDENCIAIS_DO_GATEWAY,
  GATEWAYS_DISPONIVEIS,
  TIPO_FORMA_PAGAMENTO_LABEL,
  type FormaPagamento,
} from "../types";
import { formaPagamentoSchema, type FormaPagamentoFormData } from "../schema/formaPagamento.schema";

const OPCOES_TIPO = Object.entries(TIPO_FORMA_PAGAMENTO_LABEL).map(([value, label]) => ({ value, label }));

const OPCOES_GATEWAY = [
  { value: "", label: "Nenhum — baixa manual" },
  ...GATEWAYS_DISPONIVEIS,
];

interface FormaPagamentoFormProps {
  formaPagamento?: FormaPagamento;
  loading?: boolean;
  onSubmit: (data: FormaPagamentoFormData) => void;
}

export function FormaPagamentoForm({ formaPagamento, loading = false, onSubmit }: FormaPagamentoFormProps) {
  const methods = useForm<FormaPagamentoFormData>({
    resolver: zodResolver(formaPagamentoSchema),
    defaultValues: {
      tipo: formaPagamento?.tipo ?? "PIX",
      nomePersonalizado: formaPagamento?.nomePersonalizado ?? "",
      gateway: formaPagamento?.gateway?.gateway ?? "",
      // Credenciais nascem vazias sempre: a API não as devolve, de
      // propósito. Ver o comentário em FormaPagamentoService.
      accessToken: "",
      webhookSecret: "",
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = methods;

  const tipoSelecionado = watch("tipo");
  const gatewaySelecionado = watch("gateway");

  const camposCredencial = gatewaySelecionado
    ? (CREDENCIAIS_DO_GATEWAY[gatewaySelecionado] ?? [])
    : [];

  const jaCadastradas = formaPagamento?.gateway?.credenciaisConfiguradas ?? {};

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormGrid columns={2}>
          <FormGridItem span={2}>
            <Select label="Tipo" options={OPCOES_TIPO} {...register("tipo")} />
            <ErrorMessage message={errors.tipo?.message ?? ""} />
          </FormGridItem>

          {tipoSelecionado === "OUTRO" && (
            <FormGridItem span={2}>
              <Input label="Nome da Forma de Pagamento" placeholder="Ex: Vale-treino" {...register("nomePersonalizado")} />
              <ErrorMessage message={errors.nomePersonalizado?.message ?? ""} />
            </FormGridItem>
          )}

          <FormGridItem span={2}>
            <Select label="Cobrança automática" options={OPCOES_GATEWAY} {...register("gateway")} />
            <p className="forma-pagamento-ajuda">
              Sem gateway, a baixa desta forma de pagamento é feita na mão. Com
              gateway, a cobrança é gerada e baixada automaticamente, na conta
              da sua academia.
            </p>
          </FormGridItem>

          {camposCredencial.map(({ campo, label, ajuda }) => (
            <FormGridItem span={2} key={campo}>
              <Input
                label={label}
                type="password"
                autoComplete="new-password"
                placeholder={
                  jaCadastradas[campo]
                    ? "Já cadastrado — preencha só para substituir"
                    : "Cole aqui a credencial"
                }
                {...register(campo as "accessToken" | "webhookSecret")}
              />
              <p className="forma-pagamento-ajuda">{ajuda}</p>
            </FormGridItem>
          ))}

          {gatewaySelecionado === "MERCADO_PAGO" && (
            <FormGridItem span={2}>
              <p className="forma-pagamento-aviso">
                No painel do Mercado Pago, cadastre a URL de notificação
                terminando com o número desta forma de pagamento
                {formaPagamento ? ` (${formaPagamento.id})` : " (aparece depois de salvar)"} e
                marque o evento <strong>Pagamentos</strong>. É por ela que o
                sistema sabe que a notificação é da sua academia.
              </p>
            </FormGridItem>
          )}
        </FormGrid>

        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : formaPagamento ? "Salvar Alterações" : "Cadastrar Forma de Pagamento"}
        </Button>
      </form>
    </FormProvider>
  );
}
