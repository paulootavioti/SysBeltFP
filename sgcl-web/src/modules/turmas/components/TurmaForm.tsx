import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Button } from "../../../components/ui/Button";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { FormGrid } from "../../../components/ui/FormGrid";
import { FormGridItem } from "../../../components/ui/FormGridItem";
import { DiaSemanaSelector } from "../../../components/ui/DiaSemanaSelector";

import type { Curriculo } from "../../curriculos/types/curriculo";
import { CurriculoService } from "../../curriculos/services/CurriculoService";

import type { Usuario } from "../../usuarios/types/usuario";
import { UsuarioService } from "../../usuarios/services/UsuarioService";

import { useModalidades } from "../../modalidades/hooks/useModalidades";

import type { Arena } from "../../arenas/types/arena";
import { ArenaService } from "../../arenas/services/ArenaService";

import { turmaSchema, type TurmaFormData } from "../schema/turma.schema";
import type { Turma } from "../types/turma";

interface TurmaFormProps {
  turma?: Turma;
  loading?: boolean;
  onSubmit: (data: TurmaFormData) => void;
}

export function TurmaForm({ turma, loading = false, onSubmit }: TurmaFormProps) {
  const [curriculos, setCurriculos] = useState<Curriculo[]>([]);
  // só modalidades ativas viram opção — as inativas seguem visíveis nas
  // turmas que já as usam, mas não devem entrar em turma nova.
  const { modalidades } = useModalidades(true);
  const [professores, setProfessores] = useState<Usuario[]>([]);
  const [arenas, setArenas] = useState<Arena[]>([]);

  const methods = useForm<TurmaFormData>({
    resolver: zodResolver(turmaSchema),
    defaultValues: {
      nome: turma?.nome ?? "",
      faixaEtaria: turma?.faixaEtaria ?? "",
      diasSemana: turma?.diasSemana ?? [],
      horarioInicio: turma?.horarioInicio ?? "",
      horarioFim: turma?.horarioFim ?? "",
      professorId: turma?.professorId ? String(turma.professorId) : "",
      arenaId: turma?.arenaId ? String(turma.arenaId) : "",
      curriculoId: turma?.curriculoId ? String(turma.curriculoId) : "",
      modalidadeId: turma?.modalidadeId ? String(turma.modalidadeId) : "",
      limiteAlunos: turma?.limiteAlunos ? String(turma.limiteAlunos) : "",
    },
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = methods;

  const diasSelecionados = watch("diasSemana");

  useEffect(() => {
    CurriculoService.listar().then(setCurriculos);
    UsuarioService.listar().then((usuarios) =>
      setProfessores(usuarios.filter((usuario) => usuario.perfil === "PROFESSOR"))
    );
    ArenaService.listar().then((arenas) => setArenas(arenas.filter((arena) => arena.ativo)));
  }, []);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormGrid columns={2}>
          <FormGridItem span={2}>
            <Input label="Nome da Turma" {...register("nome")} />
            <ErrorMessage message={errors.nome?.message ?? ""} />
          </FormGridItem>

          <FormGridItem>
            <Input label="Faixa Etária" placeholder="Ex: 4 a 9 anos" {...register("faixaEtaria")} />
            <ErrorMessage message={errors.faixaEtaria?.message ?? ""} />
          </FormGridItem>

          <FormGridItem>
            <Select
              label="Professor"
              options={professores.map((professor) => ({
                label: professor.apelido || professor.nome,
                value: String(professor.id),
              }))}
              {...register("professorId")}
            />
            <ErrorMessage message={errors.professorId?.message ?? ""} />
          </FormGridItem>

          <FormGridItem>
            <Select
              label="Arena (opcional)"
              options={arenas.map((arena) => ({ label: arena.nome, value: String(arena.id) }))}
              {...register("arenaId")}
            />
            <ErrorMessage message={errors.arenaId?.message ?? ""} />
          </FormGridItem>

          <FormGridItem span={2}>
            <DiaSemanaSelector
              value={diasSelecionados || []}
              onChange={(dias) => setValue("diasSemana", dias, { shouldValidate: true })}
            />
            <ErrorMessage message={errors.diasSemana?.message ?? ""} />
          </FormGridItem>

          <FormGridItem>
            <Input label="Horário de Início" type="time" {...register("horarioInicio")} />
            <ErrorMessage message={errors.horarioInicio?.message ?? ""} />
          </FormGridItem>

          <FormGridItem>
            <Input label="Horário de Término" type="time" {...register("horarioFim")} />
            <ErrorMessage message={errors.horarioFim?.message ?? ""} />
          </FormGridItem>

          <FormGridItem span={2}>
            <Select
              label="Modalidade"
              options={[
                { label: "Sem modalidade", value: "" },
                ...modalidades.map((m) => ({ label: m.nome, value: String(m.id) })),
              ]}
              {...register("modalidadeId")}
            />
          </FormGridItem>

          <FormGridItem span={2}>
            <Select
              label="Currículo (opcional)"
              options={curriculos.map((curriculo) => ({ label: curriculo.nome, value: String(curriculo.id) }))}
              {...register("curriculoId")}
            />
          </FormGridItem>

          <FormGridItem>
            <Input
              label="Limite de Alunos (opcional)"
              type="number"
              min="1"
              placeholder="Sem limite"
              {...register("limiteAlunos")}
            />
          </FormGridItem>
        </FormGrid>

        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : turma ? "Salvar Alterações" : "Cadastrar Turma"}
        </Button>
      </form>
    </FormProvider>
  );
}