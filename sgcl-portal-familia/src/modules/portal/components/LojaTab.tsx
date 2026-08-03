import { useEffect, useMemo, useState } from "react";

import { Loading } from "../../../components/ui/Loading";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";

import { PortalService } from "../services/PortalService";
import { getApiErrorMessage } from "../../../utils/getApiErrorMessage";
import { CATEGORIA_PRODUTO_LABEL } from "../types";
import type { Pedido, Produto, ProdutoVariante } from "../types";

const BADGE_STATUS_PEDIDO: Record<Pedido["status"], { label: string; variant: "warning" | "success" | "danger" }> = {
  AGUARDANDO_RETIRADA: { label: "Aguardando retirada", variant: "warning" },
  ENTREGUE: { label: "Entregue", variant: "success" },
  CANCELADO: { label: "Cancelado", variant: "danger" },
};

interface ItemCarrinhoUI {
  variante: ProdutoVariante;
  produto: Produto;
  quantidade: number;
}

interface LojaTabProps {
  alunoId: number;
}

export function LojaTab({ alunoId }: LojaTabProps) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);
  const [produtoDetalhe, setProdutoDetalhe] = useState<Produto | null>(null);
  const [varianteSelecionadaId, setVarianteSelecionadaId] = useState<number | null>(null);
  const [quantidadeSelecionada, setQuantidadeSelecionada] = useState(1);

  const [carrinho, setCarrinho] = useState<ItemCarrinhoUI[]>([]);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [erroCheckout, setErroCheckout] = useState("");
  const [pedidoConfirmado, setPedidoConfirmado] = useState<Pedido | null>(null);

  const [pedidosAbertos, setPedidosAbertos] = useState(false);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);

  function carregar() {
    setLoading(true);
    PortalService.loja(alunoId)
      .then(setProdutos)
      .catch((error) => setErro(getApiErrorMessage(error, "Não foi possível carregar a loja.")))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alunoId]);

  const categorias = useMemo(
    () => Array.from(new Set(produtos.map((p) => p.categoria))),
    [produtos]
  );

  const produtosFiltrados = categoriaAtiva
    ? produtos.filter((p) => p.categoria === categoriaAtiva)
    : produtos;

  function abrirDetalhe(produto: Produto) {
    setProdutoDetalhe(produto);
    const primeiraComEstoque = produto.variantes.find((v) => v.estoque > 0);
    setVarianteSelecionadaId(primeiraComEstoque?.id ?? null);
    setQuantidadeSelecionada(1);
  }

  function fecharDetalhe() {
    setProdutoDetalhe(null);
    setVarianteSelecionadaId(null);
  }

  function adicionarAoCarrinho() {
    if (!produtoDetalhe || !varianteSelecionadaId) return;

    const variante = produtoDetalhe.variantes.find((v) => v.id === varianteSelecionadaId);
    if (!variante) return;

    setCarrinho((atual) => {
      const existente = atual.find((item) => item.variante.id === variante.id);

      if (existente) {
        return atual.map((item) =>
          item.variante.id === variante.id
            ? { ...item, quantidade: Math.min(item.quantidade + quantidadeSelecionada, variante.estoque) }
            : item
        );
      }

      return [...atual, { variante, produto: produtoDetalhe, quantidade: quantidadeSelecionada }];
    });

    fecharDetalhe();
  }

  function removerDoCarrinho(varianteId: number) {
    setCarrinho((atual) => atual.filter((item) => item.variante.id !== varianteId));
  }

  function alterarQuantidade(varianteId: number, quantidade: number) {
    setCarrinho((atual) =>
      atual.map((item) =>
        item.variante.id === varianteId
          ? { ...item, quantidade: Math.max(1, Math.min(quantidade, item.variante.estoque)) }
          : item
      )
    );
  }

  const totalCarrinho = carrinho.reduce((soma, item) => soma + item.produto.preco * item.quantidade, 0);

  function fecharCarrinho() {
    setCarrinhoAberto(false);
    setErroCheckout("");
    setPedidoConfirmado(null);
  }

  async function finalizarCompra() {
    try {
      setFinalizando(true);
      setErroCheckout("");

      const pedido = await PortalService.criarPedido(
        alunoId,
        carrinho.map((item) => ({ varianteId: item.variante.id, quantidade: item.quantidade }))
      );

      setPedidoConfirmado(pedido);
      setCarrinho([]);
      carregar();
    } catch (error) {
      setErroCheckout(getApiErrorMessage(error, "Não foi possível finalizar o pedido."));
    } finally {
      setFinalizando(false);
    }
  }

  function abrirPedidos() {
    setPedidosAbertos(true);
    setLoadingPedidos(true);
    PortalService.listarPedidos(alunoId)
      .then(setPedidos)
      .finally(() => setLoadingPedidos(false));
  }

  if (loading) return <Loading />;
  if (erro) return <ErrorMessage message={erro} onRetry={carregar} />;

  return (
    <div className="loja-tab">
      <div className="loja-tab-topo">
        <div className="loja-tab-categorias">
          <button
            type="button"
            className={`loja-tab-chip${categoriaAtiva === null ? " loja-tab-chip-ativo" : ""}`}
            onClick={() => setCategoriaAtiva(null)}
          >
            Todos
          </button>
          {categorias.map((categoria) => (
            <button
              key={categoria}
              type="button"
              className={`loja-tab-chip${categoriaAtiva === categoria ? " loja-tab-chip-ativo" : ""}`}
              onClick={() => setCategoriaAtiva(categoria)}
            >
              {CATEGORIA_PRODUTO_LABEL[categoria]}
            </button>
          ))}
        </div>

        <div className="loja-tab-acoes-topo">
          <Button type="button" variant="secondary" size="sm" onClick={abrirPedidos}>
            Meus pedidos
          </Button>
          <Button type="button" size="sm" onClick={() => setCarrinhoAberto(true)}>
            Carrinho{carrinho.length > 0 ? ` (${carrinho.length})` : ""}
          </Button>
        </div>
      </div>

      {produtosFiltrados.length === 0 ? (
        <EmptyState title="Nenhum produto disponível" description="Volte mais tarde para conferir a loja." />
      ) : (
        <div className="loja-tab-grid">
          {produtosFiltrados.map((produto) => {
            const estoqueTotal = produto.variantes.reduce((soma, v) => soma + v.estoque, 0);

            return (
              <div key={produto.id} className="loja-tab-card">
                <div className="loja-tab-card-imagem">
                  {produto.imagemUrl ? (
                    <img src={produto.imagemUrl} alt={produto.nome} />
                  ) : (
                    <span className="loja-tab-card-imagem-placeholder">👕</span>
                  )}
                </div>

                <div className="loja-tab-card-info">
                  <strong>{produto.nome}</strong>
                  <span>{CATEGORIA_PRODUTO_LABEL[produto.categoria]}</span>
                  <span className="loja-tab-card-preco">R$ {produto.preco.toFixed(2)}</span>
                </div>

                <Button
                  type="button"
                  size="sm"
                  disabled={estoqueTotal === 0}
                  onClick={() => abrirDetalhe(produto)}
                >
                  {estoqueTotal === 0 ? "Sem estoque" : "Ver opções"}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== Detalhe do produto: escolher variante + quantidade ===== */}
      <Modal open={produtoDetalhe !== null} title={produtoDetalhe?.nome ?? ""} onClose={fecharDetalhe}>
        {produtoDetalhe && (
          <div className="loja-tab-detalhe">
            {produtoDetalhe.descricao && <p>{produtoDetalhe.descricao}</p>}
            <p className="loja-tab-card-preco">R$ {produtoDetalhe.preco.toFixed(2)}</p>

            <div className="loja-tab-variantes">
              {produtoDetalhe.variantes.map((variante) => (
                <button
                  key={variante.id}
                  type="button"
                  disabled={variante.estoque === 0}
                  className={`loja-tab-chip${varianteSelecionadaId === variante.id ? " loja-tab-chip-ativo" : ""}`}
                  onClick={() => setVarianteSelecionadaId(variante.id)}
                >
                  {variante.tamanho}
                  {variante.cor ? ` · ${variante.cor}` : ""}
                  {variante.estoque === 0 ? " (esgotado)" : ""}
                </button>
              ))}
            </div>

            {varianteSelecionadaId && (
              <label className="loja-tab-quantidade">
                Quantidade
                <input
                  type="number"
                  min={1}
                  max={produtoDetalhe.variantes.find((v) => v.id === varianteSelecionadaId)?.estoque ?? 1}
                  value={quantidadeSelecionada}
                  onChange={(e) => setQuantidadeSelecionada(Math.max(1, Number(e.target.value)))}
                />
              </label>
            )}

            <Button type="button" disabled={!varianteSelecionadaId} onClick={adicionarAoCarrinho}>
              Adicionar ao carrinho
            </Button>
          </div>
        )}
      </Modal>

      {/* ===== Carrinho e checkout ===== */}
      <Modal open={carrinhoAberto} title="Carrinho" onClose={fecharCarrinho}>
        {pedidoConfirmado ? (
          <div className="loja-tab-confirmacao">
            <p>Pedido #{pedidoConfirmado.id} confirmado!</p>
            <p className="loja-tab-confirmacao-nota">
              Ainda não temos um gateway de pagamento integrado — a confirmação é manual, como nas mensalidades.
              Retire o produto na unidade.
            </p>
            <Button type="button" onClick={fecharCarrinho}>
              Fechar
            </Button>
          </div>
        ) : carrinho.length === 0 ? (
          <EmptyState title="Carrinho vazio" description="Adicione produtos da loja para continuar." />
        ) : (
          <div className="loja-tab-carrinho">
            {carrinho.map((item) => (
              <div key={item.variante.id} className="loja-tab-carrinho-item">
                <div>
                  <strong>{item.produto.nome}</strong>
                  <span>
                    {item.variante.tamanho}
                    {item.variante.cor ? ` · ${item.variante.cor}` : ""} — R$ {item.produto.preco.toFixed(2)}
                  </span>
                </div>

                <div className="loja-tab-carrinho-item-acoes">
                  <input
                    type="number"
                    min={1}
                    max={item.variante.estoque}
                    value={item.quantidade}
                    onChange={(e) => alterarQuantidade(item.variante.id, Number(e.target.value))}
                  />
                  <button
                    type="button"
                    className="loja-tab-carrinho-remover"
                    onClick={() => removerDoCarrinho(item.variante.id)}
                    aria-label={`Remover ${item.produto.nome}`}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}

            <div className="loja-tab-carrinho-total">
              <strong>Total</strong>
              <strong>R$ {totalCarrinho.toFixed(2)}</strong>
            </div>

            <ErrorMessage message={erroCheckout} />

            <Button type="button" disabled={finalizando} onClick={finalizarCompra}>
              {finalizando ? "Finalizando..." : "Finalizar compra"}
            </Button>
          </div>
        )}
      </Modal>

      {/* ===== Meus pedidos ===== */}
      <Modal open={pedidosAbertos} title="Meus pedidos" onClose={() => setPedidosAbertos(false)}>
        {loadingPedidos ? (
          <Loading />
        ) : pedidos.length === 0 ? (
          <EmptyState title="Nenhum pedido ainda" description="Seus pedidos da loja aparecem aqui." />
        ) : (
          <div className="loja-tab-pedidos">
            {pedidos.map((pedido) => {
              const badge = BADGE_STATUS_PEDIDO[pedido.status];

              return (
                <div key={pedido.id} className="loja-tab-pedido-item">
                  <div className="loja-tab-pedido-item-topo">
                    <strong>Pedido #{pedido.id}</strong>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                  <span>
                    {pedido.itens.map((item) => `${item.quantidade}x ${item.variante.produto.nome}`).join(", ")}
                  </span>
                  <span>
                    R$ {pedido.total.toFixed(2)} — {new Date(pedido.criadoEm).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}
