import { useState } from "react";
import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Button } from "../../../../components/ui/Button";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { Table } from "../../../../components/ui/Table";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Loading } from "../../../../components/ui/Loading";
import { Badge } from "../../../../components/ui/Badge";
import { Modal } from "../../../../components/ui/Modal";
import { useToast } from "../../../../contexts/toast/useToast";
import { useAuth } from "../../../../contexts/useAuth";

import { useAssinaturas } from "../../hooks/useAssinaturas";
import { AssinaturaService } from "../../services/AssinaturaService";
import { AssinaturaForm } from "../../components/AssinaturaForm";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import { formatarData, formatarMoeda } from "../../../dashboard/utils/formatters";
import { STATUS_ASSINATURA_LABEL, type Assinatura, type StatusAssinatura } from "../../types";
import type { AssinaturaFormData } from "../../schema/assinatura.schema";

import "./styles.css";

const VARIANTE_STATUS: Record<StatusAssinatura, "success" | "warning" | "danger" | "neutral"> = {
  ATIVA: "success",
  PAUSADA: "warning",
  CANCELADA: "danger",
  CONCLUIDA: "neutral",
};

export function Assinaturas() {
  const toast = useToast();
  const { usuario } = useAuth();
  const ehAdmin = usuario?.perfil === "ADMIN";
  const { assinaturas, loading, erro, setErro, carregarAssinaturas } = useAssinaturas();
  const [modalAberto, setModalAberto] = useState(false);
  const [assinaturaEditando, setAssinaturaEditando] = useState<Assinatura | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [gerando, setGerando] = useState(false);

  function handleNovaAssinatura() {
    setAssinaturaEditando(null);
    setModalAberto(true);
  }

  function handleEditarAssinatura(assinatura: Assinatura) {
    setAssinaturaEditando(assinatura);
    setModalAberto(true);
  }

  async function handleSalvarAssinatura(data: AssinaturaFormData) {
    try {
      setSalvando(true);
      setErro("");

      if (assinaturaEditando) {
        await AssinaturaService.editar(assinaturaEditando.id, data);
        toast.success("Assinatura atualizada com sucesso.");
      } else {
        await AssinaturaService.criar(data);
        toast.success("Assinatura cadastrada com sucesso.");
      }

      await carregarAssinaturas();
      setModalAberto(false);
    } catch (error) {
      const mensagem = getApiErrorMessage(error, "Erro ao salvar assinatura.");
      setErro(mensagem);
      toast.error(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  async function handleAlterarStatus(assinatura: Assinatura, status: "ATIVA" | "PAUSADA" | "CANCELADA") {
    try {
      setErro("");
      await AssinaturaService.alterarStatus(assinatura.id, status);
      await carregarAssinaturas();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao alterar status da assinatura."));
    }
  }

  async function handleGerarCobrancas() {
    try {
      setGerando(true);
      setErro("");
      const resultado = await AssinaturaService.gerarCobrancasAgora();
      toast.success(
        `${resultado.geradas} cobrança(s) gerada(s). ${resultado.ignoradasPorDuplicidade} já existiam este mês. ${resultado.concluidas} assinatura(s) concluída(s).`
      );
      await carregarAssinaturas();
    } catch (error) {
      const mensagem = getApiErrorMessage(error, "Erro ao gerar cobranças.");
      setErro(mensagem);
      toast.error(mensagem);
    } finally {
      setGerando(false);
    }
  }

  const columns = [
    { header: "Aluno", accessor: "aluno" as const, render: (a: Assinatura) => a.aluno?.nome },
    { header: "Valor", accessor: "valor" as const, render: (a: Assinatura) => formatarMoeda(a.valor) },
    { header: "Dia Vencimento", accessor: "diaVencimento" as const },
    {
      header: "Parcelas",
      accessor: "parcelasGeradas" as const,
      render: (a: Assinatura) => (a.indeterminado ? `${a.parcelasGeradas} (indeterminado)` : `${a.parcelasGeradas}/${a.numeroParcelas}`),
    },
    { header: "Início", accessor: "dataInicio" as const, render: (a: Assinatura) => formatarData(a.dataInicio) },
    {
      header: "Status",
      accessor: "status" as const,
      render: (a: Assinatura) => <Badge variant={VARIANTE_STATUS[a.status]}>{STATUS_ASSINATURA_LABEL[a.status]}</Badge>,
    },
    {
      header: "Ações",
      accessor: "id" as const,
      render: (a: Assinatura) => (
        <div className="assinaturas-table-actions">
          <Button type="button" size="sm" variant="secondary" onClick={() => handleEditarAssinatura(a)} disabled={a.status === "CONCLUIDA"}>
            Editar
          </Button>
          {/* Pausar/Reativar/Cancelar mudam o status da assinatura — ação
              exclusiva do Administrador no backend (PATCH /assinaturas/:id/status). */}
          {ehAdmin && a.status === "ATIVA" && (
            <Button type="button" size="sm" variant="secondary" onClick={() => handleAlterarStatus(a, "PAUSADA")}>
              Pausar
            </Button>
          )}
          {ehAdmin && a.status === "PAUSADA" && (
            <Button type="button" size="sm" onClick={() => handleAlterarStatus(a, "ATIVA")}>
              Reativar
            </Button>
          )}
          {ehAdmin && (a.status === "ATIVA" || a.status === "PAUSADA") && (
            <Button type="button" size="sm" variant="danger" onClick={() => handleAlterarStatus(a, "CANCELADA")}>
              Cancelar
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <PageHeader title="Assinaturas" subtitle="Cobrança recorrente de mensalidades." />

      <div className="assinaturas-acoes">
        {ehAdmin && (
          <Button type="button" variant="secondary" disabled={gerando} onClick={handleGerarCobrancas}>
            {gerando ? "Gerando..." : "Gerar cobranças agora"}
          </Button>
        )}
        <Button type="button" onClick={handleNovaAssinatura}>
          + Nova Assinatura
        </Button>
      </div>

      <ErrorMessage message={erro} />

      {loading ? (
        <Loading />
      ) : assinaturas.length === 0 ? (
        <EmptyState
          title="Nenhuma assinatura cadastrada"
          description="Cadastre uma assinatura para começar a gerar mensalidades automaticamente."
          action={
            <Button type="button" onClick={handleNovaAssinatura}>
              Criar assinatura
            </Button>
          }
        />
      ) : (
        <Table columns={columns} data={assinaturas} />
      )}

      <Modal
        open={modalAberto}
        title={assinaturaEditando ? "Editar Assinatura" : "Nova Assinatura"}
        onClose={() => setModalAberto(false)}
      >
        <AssinaturaForm
          key={assinaturaEditando?.id ?? "nova-assinatura"}
          assinatura={assinaturaEditando ?? undefined}
          loading={salvando}
          onSubmit={handleSalvarAssinatura}
        />
      </Modal>
    </Layout>
  );
}
