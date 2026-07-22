import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "../../../../components/ui/Button";
import { ImageUpload } from "../../../../components/ui/ImageUpload";
import { FormSection } from "../../../../components/ui/FormSection";
import { Tabs } from "../../../../components/ui/Tabs";

import { alunoSchema, type AlunoFormData } from "../../schema/aluno.schema";

import { DadosPessoaisSection } from "../DadosPessoaisSection";
import { EnderecoSection } from "../EnderecoSection";
import { EscolaSection } from "../EscolaSection";
import { SaudeSection } from "../SaudeSection";
import { KimonoSection } from "../KimonoSection";
import { TurmaSection } from "../TurmaSection";
import { PagamentoSection } from "../PagamentoSection";
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
  const methods = useForm<AlunoFormData>({
    resolver: zodResolver(alunoSchema),
    defaultValues: alunoParaFormulario(aluno),
  });

  const { errors } = methods.formState;

  const temErroDados = Boolean(
    errors.nome || errors.apelido || errors.dataNascimento || errors.sexo || errors.cpf || errors.rg ||
    errors.whatsapp || errors.telefone || errors.email || errors.fotoUrl
  );

  const temErroResponsavel = Boolean(
    errors.responsavel ||
    errors.cep || errors.logradouro || errors.numero || errors.complemento ||
    errors.bairro || errors.cidade || errors.uf ||
    errors.escola || errors.serieEscolar || errors.turnoEscolar
  );

  const temErroTurma = Boolean(
    errors.turmaId || errors.formaPagamento || errors.diaVencimento || errors.planoId
  );

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
                  <FormSection title="Foto" subtitle="Foto do aluno.">
                    <ImageUpload
                      label="Foto"
                      prefixo="alunos"
                      valorAtual={methods.watch("fotoUrl")}
                      onChange={(url) => methods.setValue("fotoUrl", url)}
                    />
                  </FormSection>
                </>
              ),
            },
            {
              label: <TabLabel texto="Responsável" comErro={temErroResponsavel} />,
              value: "responsavel",
              content: (
                <>
                  <ResponsavelSection />
                  <EnderecoSection />
                  <EscolaSection />
                </>
              ),
            },
            {
              label: <TabLabel texto="Turma" comErro={temErroTurma} />,
              value: "turma",
              content: (
                <>
                  <TurmaSection />
                  <PagamentoSection />
                </>
              ),
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
