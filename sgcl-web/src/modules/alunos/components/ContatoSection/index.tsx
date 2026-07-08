import { useFormContext } from "react-hook-form";

import { Input } from "../../../../components/ui/Input";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { FormSection } from "../../../../components/ui/FormSection";

import { FormGrid } from "../../../../components/ui/FormGrid";
import { FormGridItem } from "../../../../components/ui/FormGridItem";

import { maskTelefone } from "../../../../shared/formatters/masks";

import type { AlunoFormData } from "../../schema/aluno.schema";

export function ContatoSection() {

    const {
        register,
        formState: { errors },
    } = useFormContext<AlunoFormData>();

    return (

    <FormSection
        title="Contato"
        subtitle="Informações para contato."
    >
    
        <FormGrid columns={2}>
    
        <Input
                label="Telefone *"
                {...register("telefone")}
                onChange={(e) => {
                    e.target.value = maskTelefone(e.target.value);
                    register("telefone").onChange(e);
            }}
            />
    
            <Input
                label="WhatsApp"
                {...register("whatsapp")}
                onChange={(e) => {
                    e.target.value = maskTelefone(e.target.value);
                    register("whatsapp").onChange(e);
            }}
            />
    
            <FormGridItem span={2}>
                <Input
                    label="E-mail"
                    {...register("email")}
                />
    
                <ErrorMessage
                    message={errors.email?.message ?? ""}
                />
            </FormGridItem>
    
        </FormGrid>
    
    </FormSection>
    );

}