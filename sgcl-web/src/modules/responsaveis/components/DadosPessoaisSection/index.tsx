import { useFormContext } from "react-hook-form";

import { Input } from "../../../../components/ui/Input";
import { Select } from "../../../../components/ui/Select";

import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { FormGrid } from "../../../../components/ui/FormGrid";
import { FormGridItem } from "../../../../components/ui/FormGridItem";
import { FormSection } from "../../../../components/ui/FormSection";

import { maskCPF } from "../../../../shared/formatters/masks";

import { PARENTESCOS } from "../../../../shared/constants/parentesco";

import type { ResponsavelFormData } from "../../schema/responsavel.schema";

export function DadosPessoaisSection() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ResponsavelFormData>();


  return (
    <FormSection
      title="Dados Pessoais"
      subtitle="Informações do responsável."
    >
      <FormGrid columns={2}>
        <FormGridItem span={2}>
          <Input
            label="Nome"
            {...register("nome")}
          />
        </FormGridItem>

        <Select
          label="Parentesco"
          options={PARENTESCOS}
          {...register("parentesco")}
        />

        <Select
          label="Sexo"
          options={[
            { label: "Masculino", value: "MASCULINO" },
            { label: "Feminino", value: "FEMININO" },
          ]}
          {...register("sexo")}
        />
         <div>
          
          <Input
            label="CPF"
            placeholder="000.000.000-00"
            {...register("cpf")}
            onChange={(e) => {
              e.target.value = maskCPF(e.target.value);
              register("cpf").onChange(e);
            }}
          />

          <ErrorMessage message={errors.cpf?.message ?? ""} />
        </div>
        <Input
          label="RG"
          {...register("rg")}
        />

        <Input
          label="Data de nascimento"
          type="date"
          {...register("dataNascimento")}
        />
      </FormGrid>
    </FormSection>
  );
}