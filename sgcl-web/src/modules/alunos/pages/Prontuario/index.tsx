import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { Page } from "../../../../components/sgcl/layout/Page";
import { Section } from "../../../../components/sgcl/layout/Section";
import { InfoCard } from "../../../../components/sgcl/cards/InfoCard";
import { StatusBadge } from "../../../../components/sgcl/feedback/StatusBadge";

import { PageHeader } from "../../../../components/layout/PageHeader";
import { Loading } from "../../../../components/ui/Loading";

import { AlunoService } from "../../services/AlunoService";

import "./styles.css";

interface ResponsavelProntuario {
  id: number;
  nome: string;
  parentesco?: string | null;
  telefone?: string | null;
}

interface ProntuarioAlunoData {
  aluno: {
    id: number;
    nome: string;
    dataNascimento: string;
    telefone?: string | null;
    email?: string | null;
    logradouro?: string | null;
    numero?: string | null;
    tamanhoKimono?: string | null;
    marcaKimono?: string | null;
    ativo: boolean;
  };

  resumo: {
    faixa: string;
    grau: number;
    frequencia: number;
    totalPresencas: number;
    proximoGrauEm: number;
  };

  comportamento: {
    respeito: number;
    valentia: number;
    esforco: number;
    atencao: number;
    disciplina: number;
  };

  turma?: {
    nome: string;
    horarioInicio?: string;
  } | null;

  responsaveis: ResponsavelProntuario[];
}
export function ProntuarioAluno() {
  const { id } = useParams();

  const [prontuario, setProntuario] = useState<ProntuarioAlunoData | null>(
    null
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      if (!id) return;

      const data =
        await AlunoService.prontuario<ProntuarioAlunoData>(Number(id));

      setProntuario(data);
      setLoading(false);
    }

    carregar();
  }, [id]);

  if (loading || !prontuario) {
    return (
      <Page>
        <Loading />
      </Page>
    );
  }

  const { aluno, resumo, comportamento, turma, responsaveis } = prontuario;

  return (
    <Page>
      <PageHeader title={aluno.nome} subtitle="Prontuário completo do aluno." />

      <div className="prontuario-grid">
        <InfoCard
          title="Faixa"
          value={resumo.faixa}
          description={`Grau ${resumo.grau}`}
        />

        <InfoCard
          title="Turma"
          value={turma?.nome ?? "-"}
          description={turma?.horarioInicio ?? ""}
        />

        <InfoCard
          title="Frequência"
          value={`${resumo.frequencia}%`}
          description={`${resumo.totalPresencas} presenças`}
        />

        <InfoCard
          title="Próximo grau"
          value={`${resumo.proximoGrauEm} aulas`}
          description="Previsão automática"
        />

        <InfoCard
          title="Status"
          value={<StatusBadge status={aluno.ativo ? "ATIVO" : "INATIVO"} />}
        />
      </div>

      <Section
        title="Dados pessoais"
        description="Informações principais do aluno."
      >
        <div className="prontuario-card">
          <p>
            <strong>Data de nascimento:</strong>{" "}
            {new Date(aluno.dataNascimento).toLocaleDateString("pt-BR")}
          </p>
          <p>
            <strong>Telefone:</strong> {aluno.telefone || "-"}
          </p>
          <p>
            <strong>Email:</strong> {aluno.email || "-"}
          </p>
          <p>
            <strong>Endereço:</strong> {aluno.logradouro || "-"}{" "}
            {aluno.numero || ""}
          </p>
          <p>
            <strong>Kimono:</strong> {aluno.tamanhoKimono || "-"}{" "}
            {aluno.marcaKimono || ""}
          </p>
        </div>
      </Section>

      <Section
        title="Responsáveis"
        description="Responsáveis vinculados ao aluno."
      >
        <div className="prontuario-card">
          {responsaveis.length > 0 ? (
            responsaveis.map((responsavel) => (
              <p key={responsavel.id}>
                <strong>{responsavel.nome}</strong>
                {" — "}
                {responsavel.parentesco}
                {" — "}
                {responsavel.telefone || "-"}
              </p>
            ))
          ) : (
            <p>Nenhum responsável cadastrado.</p>
          )}
        </div>
      </Section>

      <Section
        title="Comportamento"
        description="Indicadores acumulados nas aulas."
      >
        <div className="prontuario-grid">
          <InfoCard title="Respeito" value={comportamento.respeito} />
          <InfoCard title="Valentia" value={comportamento.valentia} />
          <InfoCard title="Esforço" value={comportamento.esforco} />
          <InfoCard title="Atenção" value={comportamento.atencao} />
          <InfoCard title="Disciplina" value={comportamento.disciplina} />
        </div>
      </Section>
    </Page>
  );
}
