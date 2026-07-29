import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Textarea } from "../../../components/ui/Textarea";
import { Checkbox } from "../../../components/ui/Checkbox";
import { Button } from "../../../components/ui/Button";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { FormGrid } from "../../../components/ui/FormGrid";
import { FormGridItem } from "../../../components/ui/FormGridItem";

import { AlunoService } from "../../alunos/services/AlunoService";
import { PlanoService } from "../../planos/services/PlanoService";
import { FormaPagamentoService } from "../../formasPagamento/services/FormaPagamentoService";
import { ModeloContratoService } from "../../modelosContrato/services/ModeloContratoService";
import { nomeFormaPagamento } from "../../formasPagamento/types";
import type { Aluno } from "../../alunos/types";
import type { Plano } from "../../planos/types/plano";
import type { FormaPagamento } from "../../formasPagamento/types";
import type { ModeloContrato } from "../../modelosContrato/types";

import { contratoSchema, type ContratoFormData } from "../schema/contrato.schema";
import type { Contrato } from "../types";
import "./styles.css";

interface ContratoFormProps {
  contrato?: Contrato;
  loading?: boolean;
  onSubmit: (data: ContratoFormData) => void;
}

export function ContratoForm({ contrato, loading = false, onSubmit }: ContratoFormProps) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [modelos, setModelos] = useState<ModeloContrato[]>([]);

  const methods = useForm<ContratoFormData>({
    resolver: zodResolver(contratoSchema),
    defaultValues: {
      alunoId: contrato ? String(contrato.alunoId) : "",
      modeloContratoId: contrato ? String(contrato.modeloContratoId) : "",
      planoId: contrato?.planoId ? String(contrato.planoId) : "",
      formaPagamentoId: contrato?.formaPagamentoId ? String(contrato.formaPagamentoId) : "",
      valor: contrato ? String(contrato.valor) : "",
      dataInicioVigencia: contrato ? contrato.dataInicioVigencia.slice(0, 10) : "",
      dataFimVigencia: contrato?.dataFimVigencia ? contrato.dataFimVigencia.slice(0, 10) : "",
      regrasCancelamento: contrato?.regrasCancelamento ?? "",
      clausulas: contrato?.clausulas ?? "",
      renovacaoAutomatica: contrato?.renovacaoAutomatica ?? false,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = methods;

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
    ModeloContratoService.listar()
      .then((data) => setModelos(data.filter((m) => m.ativo)))
      .catch(() => setModelos([]));
  }, []);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormGrid columns={2}>
          <FormGridItem span={2}>
            <Select
              label="Aluno"
              disabled={!!contrato}
              options={alunos.map((aluno) => ({ label: aluno.nome, value: String(aluno.id) }))}
              {...register("alunoId")}
            />
            <ErrorMessage message={errors.alunoId?.message ?? ""} />
            <p className="contrato-form-ajuda">
              Se o aluno for menor de idade, o contratante do contrato será automaticamente o responsável
              financeiro cadastrado para ele.
            </p>
          </FormGridItem>

          <FormGridItem span={2}>
            <Select
              label="Modelo de Contrato"
              options={modelos.map((modelo) => ({
                label: `${modelo.nome} (v${modelo.versao})`,
                value: String(modelo.id),
              }))}
              {...register("modeloContratoId")}
            />
            <ErrorMessage message={errors.modeloContratoId?.message ?? ""} />
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
            <Input label="Valor (R$)" type="number" step="0.01" min="0" {...register("valor")} />
            <ErrorMessage message={errors.valor?.message ?? ""} />
          </FormGridItem>

          <FormGridItem>
            <Input label="Início da Vigência" type="date" {...register("dataInicioVigencia")} />
            <ErrorMessage message={errors.dataInicioVigencia?.message ?? ""} />
          </FormGridItem>

          <FormGridItem>
            <Input label="Fim da Vigência (opcional)" type="date" {...register("dataFimVigencia")} />
          </FormGridItem>

          <FormGridItem span={2}>
            <Checkbox label="Renovar automaticamente ao final da vigência" {...register("renovacaoAutomatica")} />
          </FormGridItem>

          <FormGridItem span={2}>
            <Textarea label="Cláusulas (opcional)" rows={4} {...register("clausulas")} />
          </FormGridItem>

          <FormGridItem span={2}>
            <Textarea label="Regras de Cancelamento (opcional)" rows={4} {...register("regrasCancelamento")} />
          </FormGridItem>
        </FormGrid>

        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : contrato ? "Salvar Alterações" : "Gerar Contrato"}
        </Button>
      </form>
    </FormProvider>
  );
}
