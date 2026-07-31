import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Loading } from "../../../../components/ui/Loading";
import { Button } from "../../../../components/ui/Button";
import { Tabs } from "../../../../components/ui/Tabs";
import { Modal } from "../../../../components/ui/Modal";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";

import { ResponsavelForm } from "../../../responsaveis/components/ResponsavelForm";
import { ResponsavelService } from "../../../responsaveis/services/ResponsavelService";

import type { ResponsavelFormData } from "../../../responsaveis/schema/responsavel.schema";
import type { Responsavel } from "../../../responsaveis/types/responsavel";

import { AlunoResumo } from "../../components/AlunoResumo";
import { DadosTab } from "../../components/tabs/DadosTab";
import { ResponsaveisTab } from "../../components/tabs/ResponsaveisTab";
import { ResponsaveisNomeTab } from "../../components/tabs/ResponsaveisNomeTab";
import { PresencasTab } from "../../components/tabs/PresencasTab";
import { GraduacoesTab } from "../../components/tabs/GraduacoesTab";
import { FinanceiroTab } from "../../components/tabs/FinanceiroTab";

import { AlunoService } from "../../services/AlunoService";
import { useAuth } from "../../../../contexts/useAuth";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";

import type { AlunoCompleto, AlunoCompletoBasico } from "../../types/alunoCompleto";

import "./styles.css";

export function AlunoDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  // PROFESSOR só recebe do backend o recorte básico (nome, apelido,
  // responsável, turma, presenças, graduações) — a tela inteira renderiza
  // um layout reduzido pra esse perfil.
  const ehProfessor = usuario?.perfil === "PROFESSOR";

  const [aluno, setAluno] =
    useState<AlunoCompleto | AlunoCompletoBasico | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [
    modalResponsavelAberto,
    setModalResponsavelAberto,
  ] = useState(false);

  const [
    responsavelEditando,
    setResponsavelEditando,
  ] = useState<Responsavel | null>(null);

  async function carregarAluno() {
    if (!id) return;

    try {
      setCarregando(true);
      setErro("");

      const data = ehProfessor
        ? await AlunoService.buscarBasico(Number(id))
        : await AlunoService.buscar(Number(id));

      setAluno(data);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao carregar aluno."));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarAluno();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, ehProfessor]);

  async function recarregarAluno() {
    if (!aluno) return;

    try {
      setErro("");
      const alunoAtualizado = ehProfessor
        ? await AlunoService.buscarBasico(aluno.id)
        : await AlunoService.buscar(aluno.id);

      setAluno(alunoAtualizado);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao atualizar os dados do aluno."));
    }
  }

  async function handleSalvarResponsavel(
    data: ResponsavelFormData
  ) {
    if (!aluno) return;

    try {
      setErro("");

      if (responsavelEditando) {
        await ResponsavelService.atualizar(
          responsavelEditando.id,
          aluno.id,
          data
        );
      } else {
        await ResponsavelService.criar(
          aluno.id,
          data
        );
      }

      await recarregarAluno();

      setResponsavelEditando(null);
      setModalResponsavelAberto(false);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao salvar responsável."));
    }
  }

  async function handleExcluirResponsavel(
    responsavelId: number
  ) {
    if (!aluno) return;

    const confirmar = window.confirm(
      "Deseja realmente excluir este responsável?"
    );

    if (!confirmar) return;

    try {
      setErro("");
      await ResponsavelService.excluir(responsavelId);
      await recarregarAluno();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao excluir responsável."));
    }
  }

  function handleNovoResponsavel() {
    setResponsavelEditando(null);
    setModalResponsavelAberto(true);
  }

  function handleEditarResponsavel(
    responsavel: Responsavel
  ) {
    setResponsavelEditando(responsavel);
    setModalResponsavelAberto(true);
  }

  function handleFecharModalResponsavel() {
    setResponsavelEditando(null);
    setModalResponsavelAberto(false);
  }

  if (!aluno) {
    return (
      <Layout>
        <PageHeader title="Aluno" subtitle="Detalhes do aluno." />
        {carregando ? (
          <Loading />
        ) : (
          <ErrorMessage
            message={erro || "Aluno não encontrado."}
            onRetry={carregarAluno}
          />
        )}
      </Layout>
    );
  }

  if (ehProfessor) {
    const alunoBasico = aluno as AlunoCompletoBasico;

    return (
      <Layout>
        <div className="aluno-detalhes-acoes">
          <Button type="button" onClick={() => navigate("/alunos")}>
            Voltar para alunos
          </Button>
        </div>

        <PageHeader title={alunoBasico.nome} subtitle="Dados do aluno." />

        <ErrorMessage message={erro} />

        <AlunoResumo aluno={alunoBasico} somenteBasico />

        <Tabs
          defaultValue="responsaveis"
          tabs={[
            {
              label: "Responsáveis",
              value: "responsaveis",
              content: <ResponsaveisNomeTab responsaveis={alunoBasico.responsaveis} />,
            },
            {
              label: "Presenças",
              value: "presencas",
              content: <PresencasTab aluno={alunoBasico} />,
            },
            {
              label: "Graduações",
              value: "graduacoes",
              content: <GraduacoesTab aluno={alunoBasico} />,
            },
          ]}
        />
      </Layout>
    );
  }

  const alunoCompleto = aluno as AlunoCompleto;

  return (
    <Layout>
      <div className="aluno-detalhes-acoes">
        <Button
          type="button"
          onClick={() => navigate("/alunos")}
        >
          Voltar para alunos
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate(`/alunos/${alunoCompleto.id}/prontuario`)}
        >
          Ver Prontuário
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate(`/alunos/${alunoCompleto.id}/editar`)}
        >
          Editar
        </Button>
      </div>
      <PageHeader
        title={alunoCompleto.nome}
        subtitle="Prontuário completo do aluno."
      />

      <ErrorMessage message={erro} />

      <AlunoResumo aluno={alunoCompleto} />

      <Tabs
        defaultValue="dados"
        tabs={[
          {
            label: "Dados",
            value: "dados",
            content: <DadosTab aluno={alunoCompleto} />,
          },
          {
            label: "Responsáveis",
            value: "responsaveis",
            content: (
              <ResponsaveisTab
                responsaveis={alunoCompleto.responsaveis ?? []}
                onNovo={handleNovoResponsavel}
                onEditar={handleEditarResponsavel}
                onExcluir={(responsavel) =>
                  handleExcluirResponsavel(responsavel.id)
                }
              />
            ),
          },
          {
            label: "Presenças",
            value: "presencas",
            content: <PresencasTab aluno={alunoCompleto} />,
          },
          {
            label: "Graduações",
            value: "graduacoes",
            content: <GraduacoesTab aluno={alunoCompleto} />,
          },
          {
            label: "Financeiro",
            value: "financeiro",
            content: <FinanceiroTab aluno={alunoCompleto} />,
          },
        ]}
      />

      <Modal
        open={modalResponsavelAberto}
        title={
          responsavelEditando
            ? "Editar Responsável"
            : "Novo Responsável"
        }
        onClose={handleFecharModalResponsavel}
      >
      <ResponsavelForm
        key={responsavelEditando?.id ?? "novo-responsavel"}
        loading={false}
        initialValues={responsavelEditando ?? undefined}
        onSubmit={handleSalvarResponsavel}
      />
      </Modal>
    </Layout>
  );
}