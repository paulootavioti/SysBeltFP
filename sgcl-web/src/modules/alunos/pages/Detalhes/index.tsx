import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Loading } from "../../../../components/ui/Loading";
import { Button } from "../../../../components/ui/Button";
import { Tabs } from "../../../../components/ui/Tabs";
import { Modal } from "../../../../components/ui/Modal";

import { ResponsavelForm } from "../../../responsaveis/components/ResponsavelForm";
import { ResponsavelService } from "../../../responsaveis/services/ResponsavelService";

import type { ResponsavelFormData } from "../../../responsaveis/schema/responsavel.schema";
import type { Responsavel } from "../../../responsaveis/types/responsavel";

import { AlunoResumo } from "../../components/AlunoResumo";
import { DadosTab } from "../../components/tabs/DadosTab";
import { ResponsaveisTab } from "../../components/tabs/ResponsaveisTab";
import { PresencasTab } from "../../components/tabs/PresencasTab";
import { GraduacoesTab } from "../../components/tabs/GraduacoesTab";
import { FinanceiroTab } from "../../components/tabs/FinanceiroTab";

import { AlunoService } from "../../services/AlunoService";

import type { AlunoCompleto } from "../../types/alunoCompleto";

import "./styles.css";

export function AlunoDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [aluno, setAluno] =
    useState<AlunoCompleto | null>(null);

  const [
    modalResponsavelAberto,
    setModalResponsavelAberto,
  ] = useState(false);

  const [
    responsavelEditando,
    setResponsavelEditando,
  ] = useState<Responsavel | null>(null);

  useEffect(() => {
    async function carregarAluno() {
      if (!id) return;

      const data = await AlunoService.buscar(Number(id));

      setAluno(data as AlunoCompleto);
    }

    carregarAluno();
  }, [id]);

  async function recarregarAluno() {
    if (!aluno) return;

    const alunoAtualizado =
      await AlunoService.buscar(aluno.id);

    setAluno(alunoAtualizado as AlunoCompleto);
  }

  async function handleSalvarResponsavel(
    data: ResponsavelFormData
  ) {
    if (!aluno) return;

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
  }

  async function handleExcluirResponsavel(
    responsavelId: number
  ) {
    if (!aluno) return;

    const confirmar = window.confirm(
      "Deseja realmente excluir este responsável?"
    );

    if (!confirmar) return;

    await ResponsavelService.excluir(responsavelId);

    await recarregarAluno();
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
        <Loading />
      </Layout>
    );
  }

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
          onClick={() => navigate(`/alunos/${aluno.id}/prontuario`)}
        >
          Ver Prontuário
        </Button>
      </div>
      <PageHeader
        title={aluno.nome}
        subtitle="Prontuário completo do aluno."
      />

      <AlunoResumo aluno={aluno} />

      <Tabs
        defaultValue="dados"
        tabs={[
          {
            label: "Dados",
            value: "dados",
            content: <DadosTab aluno={aluno} />,
          },
          {
            label: "Responsáveis",
            value: "responsaveis",
            content: (
              <ResponsaveisTab
                responsaveis={aluno.responsaveis ?? []}
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
            content: <PresencasTab aluno={aluno} />,
          },
          {
            label: "Graduações",
            value: "graduacoes",
            content: <GraduacoesTab aluno={aluno} />,
          },
          {
            label: "Financeiro",
            value: "financeiro",
            content: <FinanceiroTab aluno={aluno} />,
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