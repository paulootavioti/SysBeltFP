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

import { AlunoService } from "../../alunos/services/AlunoService";
import { PlanoService } from "../../planos/services/PlanoService";
import { FormaPagamentoService } from "../../formasPagamento/services/FormaPagamentoService";
import { nomeFormaPagamento } from "../../formasPagamento/types";
import type { Aluno } from "../../alunos/types";
import type { Plano } from "../../planos/types/plano";
import type { FormaPagamento } from "../../formasPagamento/types";

import { assinaturaSchema, type AssinaturaFormData } from "../schema/assinatura.schema";
import type { Assinatura } from "../types";

interface AssinaturaFormProps {
  assinatura?: Assinatura;
  loading?: boolean;
  onSubmit: (data: AssinaturaFormData) => void;
}

export function AssinaturaForm({ assinatura, loading = false, onSubmit }: AssinaturaFormProps) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);

  const methods = useForm<AssinaturaFormData>({
    resolver: zodResolver(assinaturaSchema),
    defaultValues: {
      alunoId: assinatura ? String(assinatura.alunoId) : "",
      planoId: assinatura?.planoId ? String(assinatura.planoId) : "",
      formaPagamentoId: assinatura?.formaPagamentoId ? String(assinatura.formaPagamentoId) : "",
      valor: assinatura ? String(assinatura.valor) : "",
      diaVencimento: assinatura ? String(assinatura.diaVencimento) : "",
      dataInicio: assinatura ? assinatura.dataInicio.slice(0, 10) : "",
      dataFim: assinatura?.dataFim ? assinatura.dataFim.slice(0, 10) : "",
      indeterminado: assinatura ? assinatura.indeterminado : true,
      numeroParcelas: assinatura?.numeroParcelas ? String(assinatura.numeroParcelas) : "",
      desconto: assinatura ? String(assinatura.desconto) : "",
      acrescimo: assinatura ? String(assinatura.acrescimo) : "",
      multa: assinatura ? String(assinatura.multa) : "",
      juros: assinatura ? String(assinatura.juros) : "",
      descontoPontualidade: assinatura ? String(assinatura.descontoPontualidade) : "",
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = methods;

  const indeterminado = watch("indeterminado");

  useEffect(() => {
    AlunoService.listar()
      .then((data) => setAlunos(data.filter((a) => a.ativo)))
      .catch(() => setAlunos([]));
    PlanoService.listar()
      .then((data) => setPlanos(data.filter((p) => p.ativo)))
      .catch(() => setPlanos([]));
    FormaPagamentoService.listar()
      .then((data) => setFormasPagamento(data.filter((f) => f.ativo)))
      .catch(() => setFormasPagamento([]));
  }, []);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormGrid columns={2}>
          <FormGridItem span={2}>
            <Select
              label="Aluno"
              disabled={!!assinatura}
              options={alunos.map((aluno) => ({ label: aluno.nome, value: String(aluno.id) }))}
              {...register("alunoId")}
            />
            <ErrorMessage message={errors.alunoId?.message ?? ""} />
          </FormGridItem>

          <FormGridItem>
            <Select
              label="Plano (opcional)"
              options={planos.map((plano) => ({ label: plano.nome, value: String(plano.id) }))}
              {...register("planoId")}
            />
          </FormGridItem>

          <FormGridItem>
            <Select
              label="Forma de Pagamento (opcional)"
              options={formasPagamento.map((forma) => ({ label: nomeFormaPagamento(forma), value: String(forma.id) }))}
              {...register("formaPagamentoId")}
            />
          </FormGridItem>

          <FormGridItem>
            <Input label="Valor da Mensalidade (R$)" type="number" step="0.01" min="0" {...register("valor")} />
            <ErrorMessage message={errors.valor?.message ?? ""} />
          </FormGridItem>

          <FormGridItem>
            <Input label="Dia de Vencimento" type="number" min="1" max="31" placeholder="Ex: 10" {...register("diaVencimento")} />
            <ErrorMessage message={errors.diaVencimento?.message ?? ""} />
          </FormGridItem>

          <FormGridItem>
            <Input label="Data de Início" type="date" {...register("dataInicio")} />
            <ErrorMessage message={errors.dataInicio?.message ?? ""} />
          </FormGridItem>

          <FormGridItem>
            <Input label="Data de Término (opcional)" type="date" {...register("dataFim")} />
          </FormGridItem>

          <FormGridItem span={2}>
            <Checkbox label="Cobrança por tempo indeterminado" {...register("indeterminado")} />
          </FormGridItem>

          {!indeterminado && (
            <FormGridItem>
              <Input label="Número de Parcelas" type="number" min="1" {...register("numeroParcelas")} />
              <ErrorMessage message={errors.numeroParcelas?.message ?? ""} />
            </FormGridItem>
          )}

          <FormGridItem>
            <Input label="Desconto (R$)" type="number" step="0.01" min="0" placeholder="0,00" {...register("desconto")} />
          </FormGridItem>
          <FormGridItem>
            <Input label="Acréscimo (R$)" type="number" step="0.01" min="0" placeholder="0,00" {...register("acrescimo")} />
          </FormGridItem>
          <FormGridItem>
            <Input label="Multa por atraso (R$)" type="number" step="0.01" min="0" placeholder="0,00" {...register("multa")} />
          </FormGridItem>
          <FormGridItem>
            <Input label="Juros (R$)" type="number" step="0.01" min="0" placeholder="0,00" {...register("juros")} />
          </FormGridItem>
          <FormGridItem span={2}>
            <Input
              label="Desconto por Pontualidade (R$)"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              {...register("descontoPontualidade")}
            />
          </FormGridItem>
        </FormGrid>

        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : assinatura ? "Salvar Alterações" : "Cadastrar Assinatura"}
        </Button>
      </form>
    </FormProvider>
  );
}
