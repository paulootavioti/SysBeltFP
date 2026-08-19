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
import { FormSection } from "../../../components/ui/FormSection";
import { ImageUpload } from "../../../components/ui/ImageUpload";
import { useAuth } from "../../../contexts/useAuth";
import { UnidadeService } from "../../unidades/services/UnidadeService";
import type { Unidade } from "../../unidades/types/unidade";
import { usuarioSchema, usuarioUpdateSchema, type UsuarioUpdateFormData } from "../schema/usuario.schema";
import type { Usuario } from "../types/usuario";
import "./UsuarioForm.css";
interface UsuarioFormProps {
  usuario?: Usuario;
  loading?: boolean;
  onSubmit: (data: UsuarioUpdateFormData) => void;
}
const PERFIS_BASE = [
  { label: "Admin", value: "ADMIN" },
  { label: "Professor", value: "PROFESSOR" },
  { label: "Recepção", value: "RECEPCAO" },
];
// Perfis cujos vínculos de unidade se escolhem à mão. Admin, Professor e
// Recepção podem estar em mais de uma — Professor porque pode dar aula em
// unidades/arenas diferentes, em horários diferentes.
//
// NÃO é a mesma lista de `shared/constants/perfis`, embora se pareça: lá são
// os perfis que ALTERNAM de unidade ativa, e o DONO entra. Aqui ele fica de
// fora de propósito — o backend vincula o DONO a todas as unidades da conta
// (`unidadesDaConta`, em Create/UpdateUsuarioService), então oferecer um
// checklist a ele seria prometer uma escolha que a gravação desfaz.
const PERFIS_COM_VINCULO_ESCOLHIDO = ["ADMIN", "PROFESSOR", "RECEPCAO"];

export function UsuarioForm({ usuario, loading = false, onSubmit }: UsuarioFormProps) {
  const emEdicao = Boolean(usuario);
  const { usuario: usuarioLogado } = useAuth();
  const podeGerenciarUnidades = ["DONO", "ADMIN"].includes(usuarioLogado?.perfil ?? "");

  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [unidadeIdsSelecionadas, setUnidadeIdsSelecionadas] = useState<number[]>(
    usuario?.unidadesVinculadas?.map((vinculo) => vinculo.unidade.id) ?? []
  );

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
  const mostrarChecklistUnidades = podeGerenciarUnidades && PERFIS_COM_VINCULO_ESCOLHIDO.includes(perfil);
  const opcoesPerfil = PERFIS_BASE;

  useEffect(() => {
    if (podeGerenciarUnidades) UnidadeService.listar().then(setUnidades);
  }, [podeGerenciarUnidades]);

  function alternarUnidade(unidadeId: number) {
    setUnidadeIdsSelecionadas((atual) =>
      atual.includes(unidadeId) ? atual.filter((id) => id !== unidadeId) : [...atual, unidadeId]
    );
  }

  function handleSubmitComUnidades(data: UsuarioUpdateFormData) {
    onSubmit(mostrarChecklistUnidades ? { ...data, unidadeIds: unidadeIdsSelecionadas } : data);
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(handleSubmitComUnidades)}>
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
            <Select label="Perfil" options={opcoesPerfil} {...register("perfil")} />
            <ErrorMessage message={errors.perfil?.message ?? ""} />
          </FormGridItem>

          {mostrarChecklistUnidades && (
            <FormGridItem span={2}>
              <FormSection
                title="Unidades"
                subtitle="Selecione uma ou mais unidades onde esse usuário vai atuar."
              >
                <div className="usuario-form-unidades-checklist">
                  {unidades.map((unidade) => (
                    <Checkbox
                      key={unidade.id}
                      label={unidade.nome}
                      checked={unidadeIdsSelecionadas.includes(unidade.id)}
                      onChange={() => alternarUnidade(unidade.id)}
                    />
                  ))}
                </div>
                {unidadeIdsSelecionadas.length === 0 && (
                  <ErrorMessage message="Selecione ao menos uma unidade." />
                )}
              </FormSection>
            </FormGridItem>
          )}

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
        <Button
          type="submit"
          disabled={loading || (mostrarChecklistUnidades && unidadeIdsSelecionadas.length === 0)}
        >
          {loading ? "Salvando..." : emEdicao ? "Salvar Alterações" : "Cadastrar Usuário"}
        </Button>
      </form>
    </FormProvider>
  );
}
