import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Button } from "../../../components/ui/Button";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { FormGrid } from "../../../components/ui/FormGrid";
import { FormGridItem } from "../../../components/ui/FormGridItem";
import { usuarioSchema, type UsuarioFormData } from "../schema/usuario.schema";
interface UsuarioFormProps {
  loading?: boolean;
  onSubmit: (data: UsuarioFormData) => void;
}
const PERFIS = [
  { label: "Admin", value: "ADMIN" },
  { label: "Professor", value: "PROFESSOR" },
  { label: "Recepção", value: "RECEPCAO" },
];
export function UsuarioForm({ loading = false, onSubmit }: UsuarioFormProps) {
  const methods = useForm<UsuarioFormData>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      nome: "",
      email: "",
      senha: "",
      perfil: "",
    },
  });
  const { register, handleSubmit, formState: { errors } } = methods;
  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormGrid columns={2}>
          <FormGridItem>
            <Input label="Nome" {...register("nome")} />
            <ErrorMessage message={errors.nome?.message ?? ""} />
          </FormGridItem>
          <FormGridItem>
            <Input label="Email" type="email" {...register("email")} />
            <ErrorMessage message={errors.email?.message ?? ""} />
          </FormGridItem>
          <FormGridItem>
            <Input label="Senha" type="password" {...register("senha")} />
            <ErrorMessage message={errors.senha?.message ?? ""} />
          </FormGridItem>
          <FormGridItem>
            <Select label="Perfil" options={PERFIS} {...register("perfil")} />
            <ErrorMessage message={errors.perfil?.message ?? ""} />
          </FormGridItem>
        </FormGrid>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Cadastrar Usuário"}
        </Button>
      </form>
    </FormProvider>
  );
}