import { useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Loading } from "../../../../components/ui/Loading";
import { Button } from "../../../../components/ui/Button";
import { Tabs } from "../../../../components/ui/Tabs";
import { Modal } from "../../../../components/ui/Modal";
import { ConfirmDialog } from "../../../../components/ui/ConfirmDialog";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { CredenciaisPortalGeradasModal } from "../../../../components/sgcl/feedback/CredenciaisPortalGeradas";
import type { CredencialPortalGerada } from "../../../../components/sgcl/feedback/CredenciaisPortalGeradas";

import { ResponsavelForm } from "../../../responsaveis/components/ResponsavelForm";
import { ResponsavelService } from "../../../responsaveis/services/ResponsavelService";
import { DefinirSenhaPortalModal } from "../../../responsaveis/components/DefinirSenhaPortalModal";

import type { ResponsavelFormData } from "../../../responsaveis/schema/responsavel.schema";
import type { Responsavel } from "../../../responsaveis/types/responsavel";

import { AlunoResumo } from "../../components/AlunoResumo";
import { DadosTab } from "../../components/tabs/DadosTab";
import { ResponsaveisTab } from "../../components/tabs/ResponsaveisTab";
import { ResponsaveisNomeTab } from "../../components/tabs/ResponsaveisNomeTab";
import { PresencasTab } from "../../components/tabs/PresencasTab";
import { GraduacoesTab } from "../../components/tabs/GraduacoesTab";
import { FinanceiroTab } from "../../components/tabs/FinanceiroTab";
import { MensagensFamiliaTab } from "../../components/tabs/MensagensFamiliaTab";

import { useAuth } from "../../../../contexts/useAuth";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import { useAlunoDetalhes, type ResumoBasicoAluno } from "../../hooks/useAlunoDetalhes";

import type { AlunoCompleto, AlunoCompletoBasico } from "../../types/alunoCompleto";

import "./styles.css";

export function AlunoDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario } = useAuth();
  const [searchParams] = useSearchParams();

  // permite abrir direto numa aba específica (ex.: /alunos/1?tab=mensagens),
  // usado pelo inbox de Mensagens da Família — sem isso o link sempre cairia
  // na primeira aba e a pessoa teria que clicar em "Mensagens" de novo.
  const [abaAtiva, setAbaAtiva] = useState(searchParams.get("tab") || "dados");

  // PROFESSOR só recebe do backend o recorte básico (nome, apelido,
  // responsável, turma, presenças, graduações) — a tela inteira renderiza
  // um layout reduzido pra esse perfil.
  const ehProfessor = usuario?.perfil === "PROFESSOR";

  // se veio de Alunos > Listar, a linha clicada já tinha nome/faixa/turma
  // na mão — usa isso pra mostrar o cabeçalho na hora (ver useAlunoDetalhes).
  const resumoDaNavegacao = (location.state as { resumoBasico?: ResumoBasicoAluno } | null)?.resumoBasico;

  const {
    aluno,
    resumoBasico,
    carregando,
    erro: erroCarregamento,
    recarregar: recarregarAluno,
  } = useAlunoDetalhes(id, ehProfessor, resumoDaNavegacao);

  // erro de carregar o aluno (do hook) e erro de uma ação nesta tela
  // (salvar/excluir responsável) são coisas diferentes, mas mostradas no
  // mesmo lugar — o de carregamento tem prioridade se os dois acontecerem.
  const [erroAcao, setErroAcao] = useState("");
  const erro = erroCarregamento || erroAcao;

  const [
    modalResponsavelAberto,
    setModalResponsavelAberto,
  ] = useState(false);

  const [
    responsavelEditando,
    setResponsavelEditando,
  ] = useState<Responsavel | null>(null);

  const [responsavelParaExcluir, setResponsavelParaExcluir] = useState<Responsavel | null>(null);
  const [excluindoResponsavel, setExcluindoResponsavel] = useState(false);
  const [responsavelSenhaPortal, setResponsavelSenhaPortal] = useState<Responsavel | null>(null);
  const [credenciaisGeradas, setCredenciaisGeradas] = useState<CredencialPortalGerada[]>([]);

  async function handleSalvarResponsavel(
    data: ResponsavelFormData
  ) {
    if (!aluno) return;

    try {
      setErroAcao("");

      const responsavelSalvo = responsavelEditando
        ? await ResponsavelService.atualizar(responsavelEditando.id, aluno.id, data)
        : await ResponsavelService.criar(aluno.id, data);

      await recarregarAluno();

      setResponsavelEditando(null);
      setModalResponsavelAberto(false);

      if (responsavelSalvo.senhaPortalGerada && responsavelSalvo.email) {
        setCredenciaisGeradas([
          {
            papel: "Responsável",
            nome: responsavelSalvo.nome,
            email: responsavelSalvo.email,
            senha: responsavelSalvo.senhaPortalGerada,
          },
        ]);
      }
    } catch (error) {
      setErroAcao(getApiErrorMessage(error, "Erro ao salvar responsável."));
    }
  }

  async function confirmarExclusaoResponsavel() {
    if (!aluno || !responsavelParaExcluir) return;

    try {
      setExcluindoResponsavel(true);
      setErroAcao("");
      await ResponsavelService.excluir(responsavelParaExcluir.id);
      await recarregarAluno();
      setResponsavelParaExcluir(null);
    } catch (error) {
      setErroAcao(getApiErrorMessage(error, "Erro ao excluir responsável."));
    } finally {
      setExcluindoResponsavel(false);
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

  if (!resumoBasico) {
    return (
      <Layout>
        <PageHeader title="Aluno" subtitle="Detalhes do aluno." />
        {carregando ? (
          <Loading />
        ) : (
          <ErrorMessage
            message={erro || "Aluno não encontrado."}
            onRetry={recarregarAluno}
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

  const alunoCompleto = aluno as AlunoCompleto | null;

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
          onClick={() => navigate(`/alunos/${resumoBasico.id}/prontuario`)}
        >
          Ver Prontuário
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate(`/alunos/${resumoBasico.id}/editar`)}
        >
          Editar
        </Button>
      </div>
      <PageHeader
        title={resumoBasico.nome}
        subtitle="Prontuário completo do aluno."
      />

      <ErrorMessage message={erro} />

      <AlunoResumo aluno={resumoBasico} />

      {!alunoCompleto ? (
        <Loading message="Carregando abas..." />
      ) : (
        <Tabs
          value={abaAtiva}
          onChange={setAbaAtiva}
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
                  onExcluir={setResponsavelParaExcluir}
                  onDefinirSenhaPortal={usuario?.perfil === "ADMIN" ? setResponsavelSenhaPortal : undefined}
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
            {
              label: "Mensagens",
              value: "mensagens",
              content: <MensagensFamiliaTab aluno={alunoCompleto} />,
            },
          ]}
        />
      )}

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

      <ConfirmDialog
        open={responsavelParaExcluir !== null}
        title="Excluir responsável"
        message={`Deseja realmente excluir o responsável "${responsavelParaExcluir?.nome}"?`}
        confirmLabel="Excluir"
        loading={excluindoResponsavel}
        onConfirm={confirmarExclusaoResponsavel}
        onCancel={() => setResponsavelParaExcluir(null)}
      />

      <DefinirSenhaPortalModal
        responsavel={responsavelSenhaPortal}
        onClose={() => setResponsavelSenhaPortal(null)}
      />

      <CredenciaisPortalGeradasModal
        credenciais={credenciaisGeradas}
        onClose={() => setCredenciaisGeradas([])}
      />
    </Layout>
  );
}