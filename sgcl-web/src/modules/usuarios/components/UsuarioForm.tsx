import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Textarea } from "../../../components/ui/Textarea";
import { Button } from "../../../components/ui/Button";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { FormGrid } from "../../../components/ui/FormGrid";
import { FormGridItem } from "../../../components/ui/FormGridItem";
import { FormSection } from "../../../components/ui/FormSection";
import { ImageUpload } from "../../../components/ui/ImageUpload";
import { usuarioSchema, usuarioUpdateSchema, type UsuarioUpdateFormData } from "../schema/usuario.schema";
import type { Usuario } from "../types/usuario";
interface UsuarioFormProps {
  usuario?: Usuario;
  loading?: boolean;
  onSubmit: (data: UsuarioUpdateFormData) => void;
}
const PERFIS = [
  { label: "Admin", value: "ADMIN" },
  { label: "Professor", value: "PROFESSOR" },
  { label: "Recepção", value: "RECEPCAO" },
];
export function UsuarioForm({ usuario, loading = false, onSubmit }: UsuarioFormProps) {
  const emEdicao = Boolean(usuario);

  const methods = useForm<UsuarioUpdateFormData>({
    resolver: zodResolver(emEdicao ? usuarioUpdateSchema : usuarioSchema),
    defaultValues: {
      nome: usuario?.nome ?? "",
      apelido: usuario?.apelido ?? "",
      email: usuario?.email ?? "",
      senha: "",
      perfil: usuario?.perfil ?? "",
      nivelGraduacao: usuario?.nivelGraduacao ?? "",
      outrasGraduacoes: usuario?.outrasGraduacoes ?? "",
      fotoUrl: usuario?.fotoUrl ?? null,
    },
  });
  const { register, handleSubmit, watch, formState: { errors } } = methods;
  const perfil = watch("perfil");
  const ehProfessor = perfil === "PROFESSOR";
  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormGrid columns={2}>
          <FormGridItem>
            <Input label="Nome" {...register("nome")} />
            <ErrorMessage message={errors.nome?.message ?? ""} />
          </FormGridItem>
          <FormGridItem>
            <Input label="Apelido (como gosta de ser chamado)" {...register("apelido")} />
          </FormGridItem>
          <FormGridItem>
            <Input label="Email" type="email" {...register("email")} />
            <ErrorMessage message={errors.email?.message ?? ""} />
          </FormGridItem>
          <FormGridItem>
            <Input
              label={emEdicao ? "Nova senha (deixe em branco para manter a atual)" : "Senha"}
              type="password"
              {...register("senha")}
            />
            <ErrorMessage message={errors.senha?.message ?? ""} />
          </FormGridItem>
          <FormGridItem>
            <Select label="Perfil" options={PERFIS} {...register("perfil")} />
            <ErrorMessage message={errors.perfil?.message ?? ""} />
          </FormGridItem>

          <FormGridItem span={2}>
            <FormSection title="Foto" subtitle="Foto do usuário.">
              <ImageUpload
                label="Foto"
                prefixo="usuarios"
                valorAtual={methods.watch("fotoUrl")}
                onChange={(url) => methods.setValue("fotoUrl", url)}
              />
            </FormSection>
          </FormGridItem>

          {ehProfessor && (
            <>
              <FormGridItem>
                <Input
                  label="Nível de graduação"
                  placeholder="Ex: Faixa Preta 2º grau"
                  {...register("nivelGraduacao")}
                />
              </FormGridItem>

              <FormGridItem span={2}>
                <Textarea
                  label="Outras graduações ou habilidades"
                  rows={3}
                  placeholder="Ex: Faixa Marrom de Judô, instrutor de Muay Thai..."
                  {...register("outrasGraduacoes")}
                />
              </FormGridItem>
            </>
          )}
        </FormGrid>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : emEdicao ? "Salvar Alterações" : "Cadastrar Usuário"}
        </Button>
      </form>
    </FormProvider>
  );
}
