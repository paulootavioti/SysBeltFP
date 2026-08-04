import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuShirt, LuAward, LuTag, LuKeyRound, LuGem, LuPackage } from "react-icons/lu";
import type { IconType } from "react-icons";

import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Button } from "../../../../components/ui/Button";
import { Input } from "../../../../components/ui/Input";
import { Select } from "../../../../components/ui/Select";
import { Badge } from "../../../../components/ui/Badge";
import { StatusBadge } from "../../../../components/ui/StatusBadge";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { Table } from "../../../../components/ui/Table";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Loading } from "../../../../components/ui/Loading";
import { Modal } from "../../../../components/ui/Modal";
import { ConfirmDialog } from "../../../../components/ui/ConfirmDialog";
import { DashboardKpiCard } from "../../../dashboard/components/DashboardKpiCard";
import { formatarMoeda } from "../../../dashboard/utils/formatters";
import { useToast } from "../../../../contexts/toast/useToast";
import { useAuth } from "../../../../contexts/useAuth";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";

import { useProdutos } from "../../hooks/useProdutos";
import { LojaService } from "../../services/LojaService";
import { ProdutoForm } from "../../components/ProdutoForm";
import { EstoqueBadge } from "../../components/EstoqueBadge";
import { CATEGORIA_PRODUTO_LABEL, type Produto, type LojaKpis } from "../../types";
import type { ProdutoFormData, VarianteFormData } from "../../schema/produto.schema";

import "./styles.css";

const OPCOES_CATEGORIA = Object.entries(CATEGORIA_PRODUTO_LABEL).map(([value, label]) => ({ value, label }));

const ICONE_POR_CATEGORIA: Record<string, IconType> = {
  KIMONO: LuShirt,
  RASHGUARD: LuShirt,
  BERMUDA: LuShirt,
  FAIXA: LuAward,
  PATCH: LuTag,
  CHAVEIRO: LuKeyRound,
  PULSEIRA: LuGem,
  OUTROS: LuPackage,
};

export function Loja() {
  const toast = useToast();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const ehSuperadmin = usuario?.perfil === "SUPERADMIN";

  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");

  const filtros = useMemo(
    () => ({ busca: busca || undefined, categoria: filtroCategoria || undefined, ativo: filtroStatus || undefined }),
    [busca, filtroCategoria, filtroStatus]
  );

  const { produtos, loading, erro, setErro, carregarProdutos } = useProdutos(filtros);

  const [kpis, setKpis] = useState<LojaKpis | null>(null);

  async function carregarKpis() {
    try {
      const data = await LojaService.kpis();
      setKpis(data);
    } catch {
      // KPIs são um complemento visual — falha ao carregar não deve travar a tela.
    }
  }

  useEffect(() => {
    carregarKpis();
  }, []);

  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [produtoParaInativar, setProdutoParaInativar] = useState<Produto | null>(null);
  const [alterandoStatus, setAlterandoStatus] = useState(false);

  const rotuloStatus: Record<string, string> = { true: "Ativo", false: "Inativo" };

  const filtrosAtivos = [
    filtroCategoria && {
      chave: "categoria",
      rotulo: `Categoria: ${CATEGORIA_PRODUTO_LABEL[filtroCategoria as keyof typeof CATEGORIA_PRODUTO_LABEL]}`,
      limpar: () => setFiltroCategoria(""),
    },
    filtroStatus && {
      chave: "status",
      rotulo: `Status: ${rotuloStatus[filtroStatus]}`,
      limpar: () => setFiltroStatus(""),
    },
  ].filter((filtro): filtro is { chave: string; rotulo: string; limpar: () => void } => !!filtro);

  function handleNovoProduto() {
    setProdutoEditando(null);
    setModalAberto(true);
  }

  function handleEditarProduto(produto: Produto) {
    setProdutoEditando(produto);
    setModalAberto(true);
  }

  async function handleSalvarProduto(data: ProdutoFormData & { variantes: VarianteFormData[] }) {
    try {
      setSalvando(true);
      setErro("");

      if (produtoEditando) {
        await LojaService.editar(produtoEditando.id, data);
        toast.success("Produto atualizado com sucesso.");
      } else {
        await LojaService.criar(data);
        toast.success("Produto cadastrado com sucesso.");
      }

      await carregarProdutos();
      await carregarKpis();
      setModalAberto(false);
    } catch (error) {
      const mensagem = getApiErrorMessage(error, "Erro ao salvar produto.");
      setErro(mensagem);
      toast.error(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  async function handleAlterarStatus(id: number) {
    try {
      setAlterandoStatus(true);
      setErro("");
      await LojaService.alterarStatus(id);
      await carregarProdutos();
      await carregarKpis();
      setProdutoParaInativar(null);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao alterar status do produto."));
    } finally {
      setAlterandoStatus(false);
    }
  }

  const columns = [
    {
      header: "Produto",
      accessor: "id" as const,
      render: (produto: Produto) => {
        const Icone = ICONE_POR_CATEGORIA[produto.categoria] ?? LuPackage;

        return (
          <div className="loja-produto-celula">
            <div className="loja-produto-titulo">
              <Icone size={16} />
              <span>{produto.nome}</span>
              {produto.estoqueBaixo && <Badge variant="warning">⚠ estoque baixo</Badge>}
            </div>

            {produto.variantes.length > 0 && (
              <div className="loja-produto-variantes">
                {produto.variantes.map((variante) => (
                  <EstoqueBadge key={variante.id} variante={variante} />
                ))}
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: "Categoria",
      accessor: "categoria" as const,
      render: (produto: Produto) => CATEGORIA_PRODUTO_LABEL[produto.categoria],
    },
    ...(ehSuperadmin
      ? [
          {
            header: "Unidade",
            accessor: "unidade" as const,
            render: (produto: Produto) => produto.unidade.nome,
          },
        ]
      : []),
    {
      header: "Status",
      accessor: "ativo" as const,
      render: (produto: Produto) => <StatusBadge status={produto.ativo ? "ATIVO" : "INATIVO"} />,
    },
    {
      header: "Preço",
      accessor: "preco" as const,
      render: (produto: Produto) => formatarMoeda(produto.preco),
    },
    {
      header: "Estoque total",
      accessor: "estoqueTotal" as const,
      render: (produto: Produto) => `${produto.estoqueTotal} un. (${produto.numVariantes} variante${produto.numVariantes === 1 ? "" : "s"})`,
    },
    {
      header: "Ações",
      accessor: "id" as const,
      render: (produto: Produto) => (
        <div className="loja-table-acoes">
          <Button type="button" size="sm" variant="secondary" onClick={() => handleEditarProduto(produto)}>
            Editar
          </Button>
          <Button
            type="button"
            size="sm"
            variant={produto.ativo ? "danger" : "primary"}
            onClick={() => (produto.ativo ? setProdutoParaInativar(produto) : handleAlterarStatus(produto.id))}
          >
            {produto.ativo ? "Inativar" : "Ativar"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <PageHeader title="Loja" subtitle="Catálogo de produtos e controle de estoque da academia." />

      {kpis && (
        <div className="kpi-grid">
          <DashboardKpiCard titulo="Produtos ativos" valor={String(kpis.produtosAtivos)} />
          <DashboardKpiCard titulo="Unidades em estoque" valor={String(kpis.unidadesEmEstoque)} />
          <DashboardKpiCard titulo="Produtos com estoque baixo" valor={String(kpis.produtosComEstoqueBaixo)} />
          <DashboardKpiCard titulo="Valor total em estoque" valor={formatarMoeda(kpis.valorTotalEstoque)} />
        </div>
      )}

      <div className="loja-acoes">
        <Button type="button" variant="secondary" onClick={() => navigate("/loja/pedidos")}>
          Pedidos
        </Button>
        <Button type="button" onClick={handleNovoProduto}>
          + Novo Produto
        </Button>
      </div>

      <ErrorMessage message={erro} />

      <div className="loja-search">
        <Input
          label="Pesquisar produto"
          placeholder="Digite o nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        <Select
          label="Categoria"
          options={OPCOES_CATEGORIA}
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
        />

        <Select
          label="Status"
          options={[
            { value: "true", label: "Ativo" },
            { value: "false", label: "Inativo" },
          ]}
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
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
      ) : produtos.length === 0 ? (
        <EmptyState
          title="Nenhum produto encontrado"
          description="Cadastre os produtos vendidos pela academia (kimonos, rashguards, faixas etc)."
        />
      ) : (
        <Table columns={columns} data={produtos} />
      )}

      <Modal
        open={modalAberto}
        title={produtoEditando ? "Editar Produto" : "Novo Produto"}
        onClose={() => setModalAberto(false)}
        size="lg"
      >
        <ProdutoForm
          key={produtoEditando?.id ?? "novo-produto"}
          produto={produtoEditando ?? undefined}
          loading={salvando}
          onSubmit={handleSalvarProduto}
        />
      </Modal>

      <ConfirmDialog
        open={produtoParaInativar !== null}
        title="Inativar produto"
        message={`Inativar "${produtoParaInativar?.nome ?? ""}"? Ele deixa de aparecer para venda, mas o histórico é mantido.`}
        confirmLabel="Inativar"
        loading={alterandoStatus}
        onConfirm={() => produtoParaInativar && handleAlterarStatus(produtoParaInativar.id)}
        onCancel={() => setProdutoParaInativar(null)}
      />
    </Layout>
  );
}
