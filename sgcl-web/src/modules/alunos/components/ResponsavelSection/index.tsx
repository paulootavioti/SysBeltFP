import { useFormContext } from "react-hook-form";

import { FormSection } from "../../../../components/ui/FormSection";
import { Input } from "../../../../components/ui/Input";
import { Checkbox } from "../../../../components/ui/Checkbox";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { FormGrid } from "../../../../components/ui/FormGrid";
import { FormGridItem } from "../../../../components/ui/FormGridItem";

import { calcularIdade } from "../../../../shared/formatters/data";

import type { AlunoFormData } from "../../schema/aluno.schema";

import { Select } from "../../../../components/ui/Select";
import { PARENTESCOS } from "../../../../shared/constants/parentesco";

export function ResponsavelSection() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<AlunoFormData>();

  const dataNascimento = watch("dataNascimento");
  const idade = calcularIdade(dataNascimento);
  const obrigatorio = idade !== null && idade < 18;

  return (
    <FormSection
      title="Responsável"
      subtitle={
        obrigatorio
          ? "Obrigatório — o aluno é menor de 18 anos."
          : "Opcional para alunos maiores de 18 anos. Responsáveis adicionais podem ser cadastrados depois, na tela de detalhes do aluno."
      }
    >
      <FormGrid columns={2}>
        <FormGridItem>
          <Input label={`Nome${obrigatorio ? " *" : ""}`} {...register("responsavel.nome")} />
          <ErrorMessage message={errors.responsavel?.nome?.message ?? ""} />
        </FormGridItem>

        <FormGridItem>
          <Select
            label={`Parentesco${obrigatorio ? " *" : ""}`}
            options={PARENTESCOS}
            {...register("responsavel.parentesco")}
          />
          <ErrorMessage message={errors.responsavel?.parentesco?.message ?? ""} />
        </FormGridItem>

        <FormGridItem>
          <Input label="Telefone" {...register("responsavel.telefone")} />
        </FormGridItem>

        <FormGridItem>
          <Input label="WhatsApp" {...register("responsavel.whatsapp")} />
        </FormGridItem>

        <FormGridItem span={2}>
          <Input label="Email" {...register("responsavel.email")} />
        </FormGridItem>

        <FormGridItem span={2}>
          <Checkbox label="Responsável financeiro" {...register("responsavel.responsavelFinanceiro")} />
          <Checkbox label="Pode buscar o aluno" {...register("responsavel.podeBuscar")} />
          <Checkbox label="Contato de emergência" {...register("responsavel.contatoEmergencia")} />
          <Checkbox label="Recebe comunicados" {...register("responsavel.recebeComunicados")} />
        </FormGridItem>
      </FormGrid>
    </FormSection>
  );
}