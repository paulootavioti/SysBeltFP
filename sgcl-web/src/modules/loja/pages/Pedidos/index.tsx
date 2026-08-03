import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Button } from "../../../../components/ui/Button";
import { Select } from "../../../../components/ui/Select";
import { Input } from "../../../../components/ui/Input";
import { Badge } from "../../../../components/ui/Badge";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { Table } from "../../../../components/ui/Table";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Loading } from "../../../../components/ui/Loading";
import { ConfirmDialog } from "../../../../components/ui/ConfirmDialog";
import { formatarMoeda } from "../../../dashboard/utils/formatters";
import { useToast } from "../../../../contexts/toast/useToast";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";

import { LojaService } from "../../services/LojaService";
import { STATUS_PEDIDO_LABEL, type Pedido, type StatusPedido } from "../../types";

import "../Listar/styles.css";

const VARIANTE_BADGE_STATUS: Record<StatusPedido, "warning" | "success" | "danger"> = {
  AGUARDANDO_RETIRADA: "warning",
  ENTREGUE: "success",
  CANCELADO: "danger",
};

export function Pedidos() {
  const navigate = useNavigate();
  const toast = useToast();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<StatusPedido | "">("");

  const filtros = useMemo(
    () => ({ busca: busca || undefined, status: filtroStatus || undefined }),
    [busca, filtroStatus]
  );

  async function carregar() {
    try {
      setLoading(true);
      setErro("");
      const data = await LojaService.listarPedidos(filtros);
      setPedidos(data);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao carregar pedidos."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  const [processandoId, setProcessandoId] = useState<number | null>(null);
  const [pedidoParaCancelar, setPedidoParaCancelar] = useState<Pedido | null>(null);

  const filtrosAtivos = [
    filtroStatus && {
      chave: "status",
      rotulo: `Status: ${STATUS_PEDIDO_LABEL[filtroStatus]}`,
      limpar: () => setFiltroStatus(""),
    },
  ].filter((filtro): filtro is { chave: string; rotulo: string; limpar: () => void } => !!filtro);

  async function handleEntregar(pedido: Pedido) {
    try {
      setProcessandoId(pedido.id);
      await LojaService.marcarPedidoEntregue(pedido.id);
      toast.success(`Pedido #${pedido.id} marcado como entregue.`);
      await carregar();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao marcar pedido como entregue."));
    } finally {
      setProcessandoId(null);
    }
  }

  async function handleCancelar(pedido: Pedido) {
    try {
      setProcessandoId(pedido.id);
      await LojaService.cancelarPedido(pedido.id);
      toast.success(`Pedido #${pedido.id} cancelado. Estoque restaurado.`);
      setPedidoParaCancelar(null);
      await carregar();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao cancelar pedido."));
    } finally {
      setProcessandoId(null);
    }
  }

  const columns = [
    {
      header: "Pedido",
      accessor: "id" as const,
      render: (pedido: Pedido) => `#${pedido.id}`,
    },
    {
      header: "Aluno",
      accessor: "aluno" as const,
      render: (pedido: Pedido) => pedido.aluno.apelido || pedido.aluno.nome,
    },
    {
      header: "Itens",
      accessor: "itens" as const,
      render: (pedido: Pedido) => (
        <div className="loja-produto-variantes">
          {pedido.itens.map((item) => (
            <span key={item.id}>
              {item.quantidade}x {item.variante.produto.nome} ({item.variante.tamanho})
            </span>
          ))}
        </div>
      ),
    },
    {
      header: "Total",
      accessor: "total" as const,
      render: (pedido: Pedido) => formatarMoeda(pedido.total),
    },
    {
      header: "Status",
      accessor: "status" as const,
      render: (pedido: Pedido) => (
        <Badge variant={VARIANTE_BADGE_STATUS[pedido.status]}>{STATUS_PEDIDO_LABEL[pedido.status]}</Badge>
      ),
    },
    {
      header: "Data",
      accessor: "criadoEm" as const,
      render: (pedido: Pedido) => new Date(pedido.criadoEm).toLocaleDateString("pt-BR"),
    },
    {
      header: "Ações",
      accessor: "id" as const,
      render: (pedido: Pedido) =>
        pedido.status === "AGUARDANDO_RETIRADA" ? (
          <div className="loja-table-acoes">
            <Button
              type="button"
              size="sm"
              disabled={processandoId === pedido.id}
              onClick={() => handleEntregar(pedido)}
            >
              Marcar como Entregue
            </Button>
            <Button
              type="button"
              size="sm"
              variant="danger"
              disabled={processandoId === pedido.id}
              onClick={() => setPedidoParaCancelar(pedido)}
            >
              Cancelar
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <Layout>
      <PageHeader title="Pedidos" subtitle="Pedidos feitos pelas famílias na loja do Portal da Família." />

      <div className="loja-acoes">
        <Button type="button" variant="secondary" onClick={() => navigate("/loja")}>
          Produtos
        </Button>
      </div>

      <ErrorMessage message={erro} />

      <div className="loja-search">
        <Input
          label="Pesquisar aluno"
          placeholder="Digite o nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        <Select
          label="Status"
          options={Object.entries(STATUS_PEDIDO_LABEL).map(([value, label]) => ({ value, label }))}
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value as StatusPedido | "")}
        />
      </div>

      {filtrosAtivos.length > 0 && (
        <div className="loja-filtros-ativos">
          {filtrosAtivos.map((filtro) => (
            <span key={filtro.chave} className="loja-filtro-chip">
              {filtro.rotulo}
              <button type="button" onClick={filtro.limpar} aria-label={`Remover filtro ${filtro.rotulo}`}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {loading ? (
        <Loading />
      ) : pedidos.length === 0 ? (
        <EmptyState title="Nenhum pedido encontrado" description="Os pedidos feitos pelas famílias aparecem aqui." />
      ) : (
        <Table columns={columns} data={pedidos} />
      )}

      <ConfirmDialog
        open={pedidoParaCancelar !== null}
        title="Cancelar pedido"
        message={`Cancelar o pedido #${pedidoParaCancelar?.id ?? ""}? O estoque dos itens é restaurado automaticamente.`}
        confirmLabel="Cancelar pedido"
        loading={processandoId === pedidoParaCancelar?.id}
        onConfirm={() => pedidoParaCancelar && handleCancelar(pedidoParaCancelar)}
        onCancel={() => setPedidoParaCancelar(null)}
      />
    </Layout>
  );
}
