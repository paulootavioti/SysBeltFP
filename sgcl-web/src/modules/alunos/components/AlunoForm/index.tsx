import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

import { Button } from "../../../../components/ui/Button";
import { ImageUpload } from "../../../../components/ui/ImageUpload";
import { FormSection } from "../../../../components/ui/FormSection";
import { Tabs } from "../../../../components/ui/Tabs";

import { alunoSchema, type AlunoFormData } from "../../schema/aluno.schema";

import { DadosPessoaisSection } from "../DadosPessoaisSection";
import { ContatoSection } from "../ContatoSection";
import { EnderecoSection } from "../EnderecoSection";
import { EscolaSection } from "../EscolaSection";
import { SaudeSection } from "../SaudeSection";
import { KimonoSection } from "../KimonoSection";
import { TurmaSection } from "../TurmaSection";
import { ObservacoesSection } from "../ObservacoesSection";
import { ResponsavelSection } from "../ResponsavelSection";

import { alunoParaFormulario } from "../../mappers/aluno.mapper";

import type { AlunoFormProps } from "./types";

import "./styles.css";

function TabLabel({ texto, comErro }: { texto: string; comErro: boolean }) {
  return (
    <span className="aluno-form-tab-label">
      {texto}
      {comErro && (
        <span
          className="aluno-form-tab-erro"
          title="Há campos obrigatórios pendentes nesta aba"
        />
      )}
    </span>
  );
}

export function AlunoForm({ aluno, loading, onSubmit }: AlunoFormProps) {
  const [, setFoto] = useState<File | null>(null);
  const methods = useForm<AlunoFormData>({
    resolver: zodResolver(alunoSchema),
    defaultValues: alunoParaFormulario(aluno),
  });

  const { errors } = methods.formState;

  const temErroDados = Boolean(
    errors.nome || errors.dataNascimento || errors.sexo || errors.cpf || errors.rg ||
    errors.cep || errors.logradouro || errors.numero || errors.complemento ||
    errors.bairro || errors.cidade || errors.uf || errors.escola ||
    errors.serieEscolar || errors.turnoEscolar || errors.fotoUrl
  );

  const temErroContato = Boolean(errors.telefone || errors.whatsapp || errors.email);
  const temErroResponsavel = Boolean(errors.responsavel);
  const temErroTurma = Boolean(errors.turmaId);
  const temErroSaude = Boolean(
    errors.peso || errors.altura || errors.restricoesMedicas ||
    errors.alergias || errors.medicamentos || errors.tamanhoKimono ||
    errors.marcaKimono || errors.observacoes
  );

  return (
    <FormProvider {...methods}>
      <form className="aluno-form" onSubmit={methods.handleSubmit(onSubmit)}>
        <Tabs
          defaultValue="dados"
          tabs={[
            {
              label: <TabLabel texto="Dados Pessoais" comErro={temErroDados} />,
              value: "dados",
              content: (
                <>
                  <DadosPessoaisSection />
                  <EnderecoSection />
                  <EscolaSection />
                  <FormSection title="Foto" subtitle="Foto do aluno.">
                    <ImageUpload label="Foto" onChange={setFoto} />
                  </FormSection>
                </>
              ),
            },
            {
              label: <TabLabel texto="Contato" comErro={temErroContato} />,
              value: "contato",
              content: <ContatoSection />,
            },
            {
              label: <TabLabel texto="Responsável" comErro={temErroResponsavel} />,
              value: "responsavel",
              content: <ResponsavelSection />,
            },
            {
              label: <TabLabel texto="Turma" comErro={temErroTurma} />,
              value: "turma",
              content: <TurmaSection />,
            },
            {
              label: <TabLabel texto="Saúde" comErro={temErroSaude} />,
              value: "saude",
              content: (
                <>
                  <SaudeSection />
                  <KimonoSection />
                  <ObservacoesSection />
                </>
              ),
            },
          ]}
        />

        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar"}
        </Button>
      </form>
    </FormProvider>
  );
}