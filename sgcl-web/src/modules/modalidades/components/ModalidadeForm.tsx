import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Checkbox } from "../../../components/ui/Checkbox";
import { Button } from "../../../components/ui/Button";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";

import { useAuth } from "../../../contexts/useAuth";
import type { Unidade } from "../../unidades/types/unidade";
import { UnidadeService } from "../../unidades/services/UnidadeService";
import type { Usuario } from "../../usuarios/types/usuario";
import { UsuarioService } from "../../usuarios/services/UsuarioService";

import { modalidadeSchema, type ModalidadeFormData } from "../schema/modalidade.schema";
import type { Modalidade } from "../types/modalidade";

interface ModalidadeFormProps {
  modalidade?: Modalidade;
  loading?: boolean;
  onSubmit: (data: ModalidadeFormData) => void;
}

// Só faz sentido coordenar uma modalidade quem dá aula ou gerencia.
const PERFIS_COORDENADOR = ["ADMIN", "PROFESSOR"];

export function ModalidadeForm({ modalidade, loading = false, onSubmit }: ModalidadeFormProps) {
  const { usuario } = useAuth();
  const ehSuperadmin = usuario?.perfil === "SUPERADMIN";

  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [candidatos, setCandidatos] = useState<Usuario[]>([]);

  const methods = useForm<ModalidadeFormData>({
    resolver: zodResolver(modalidadeSchema),
    defaultValues: {
      nome: modalidade?.nome ?? "",
      descricao: modalidade?.descricao ?? "",
      publicoAlvo: modalidade?.publicoAlvo ?? "",
      coordenadorId: modalidade?.coordenadorId ? String(modalidade.coordenadorId) : "",
      visivelNaLanding: modalidade?.visivelNaLanding ?? false,
      ordem: String(modalidade?.ordem ?? 0),
      unidadeId: modalidade?.unidade ? String(modalidade.unidade.id) : "",
    },
  });

  const { register, handleSubmit, formState: { errors } } = methods;

  useEffect(() => {
    if (ehSuperadmin && !modalidade) {
      UnidadeService.listar().then((lista) => setUnidades(lista.filter((u) => u.ativo)));
    }
  }, [ehSuperadmin, modalidade]);

  useEffect(() => {
    UsuarioService.listar()
      .then((lista) =>
        setCandidatos(lista.filter((u) => u.ativo && PERFIS_COORDENADOR.includes(u.perfil)))
      )
      .catch(() => setCandidatos([]));
  }, []);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Input label="Nome" placeholder="Ex: Jiu-Jitsu Kids" {...register("nome")} />
        <ErrorMessage message={errors.nome?.message ?? ""} />

        <Input
          label="Público (aparece no site)"
          placeholder="Ex: 4 a 13 anos"
          {...register("publicoAlvo")}
        />

        <Input
          label="Descrição (aparece no site)"
          placeholder="Ex: Disciplina e respeito num ambiente lúdico."
          {...register("descricao")}
        />

        <Select
          label="Coordenador técnico"
          options={[
            { label: "Sem coordenador", value: "" },
            ...candidatos.map((c) => ({ label: c.nome, value: String(c.id) })),
          ]}
          {...register("coordenadorId")}
        />

        <Input
          label="Ordem no site"
          type="number"
          min={0}
          placeholder="0"
          {...register("ordem")}
        />

        <Checkbox
          label="Exibir esta modalidade no site público"
          {...register("visivelNaLanding")}
        />

        {ehSuperadmin && !modalidade && (
          <>
            <Select
              label="Unidade"
              options={unidades.map((u) => ({ label: u.nome, value: String(u.id) }))}
              {...register("unidadeId")}
            />
            <ErrorMessage message={errors.unidadeId?.message ?? ""} />
          </>
        )}

        {ehSuperadmin && modalidade?.unidade && (
          <p className="modalidades-vazio">Unidade: {modalidade.unidade.nome}</p>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : modalidade ? "Salvar Alterações" : "Cadastrar Modalidade"}
        </Button>
      </form>
    </FormProvider>
  );
}
