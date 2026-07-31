import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Card } from "../../../../components/ui/Card";
import { Button } from "../../../../components/ui/Button";
import { Input } from "../../../../components/ui/Input";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { Loading } from "../../../../components/ui/Loading";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Pagination } from "../../../../components/ui/Pagination";
import { useMensalidades } from "../../hooks/useMensalidades";
import { MensalidadeService } from "../../services/MensalidadeService";
import { MensalidadeCard } from "../../components/MensalidadeCard";
import { MotivoModal } from "../../components/MotivoModal";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import { calcularStatusMensalidade } from "../../utils/status";
import { useToast } from "../../../../contexts/toast/useToast";
import { usePaginacaoCliente } from "../../../../hooks/usePaginacaoCliente";
import "./styles.css";

type Filtro = "TODAS" | "PENDENTE" | "VENCIDA" | "PAGA" | "CANCELADA" | "ESTORNADA";
type AcaoComMotivo = { tipo: "CANCELAR" | "ESTORNAR"; id: number } | null;

export function ListarMensalidades() {
  const navigate = useNavigate();
  const toast = useToast();
  const { mensalidades, loading, erro, setErro, carregarMensalidades } = useMensalidades();
  const [filtro, setFiltro] = useState<Filtro>("TODAS");
  const [busca, setBusca] = useState("");
  const [acaoComMotivo, setAcaoComMotivo] = useState<AcaoComMotivo>(null);
  const [enviandoMotivo, setEnviandoMotivo] = useState(false);

  const mensalidadesFiltradas = mensalidades
    .filter((m) => {
      const status = calcularStatusMensalidade(m);
      if (filtro === "TODAS") return true;
      return status === filtro;
    })
    .filter((m) =>
      m.aluno?.nome.toLowerCase().includes(busca.toLowerCase())
    );

  const paginacao = usePaginacaoCliente(mensalidadesFiltradas, 12, [filtro, busca]);

  async function handleMarcarComoPago(id: number) {
    try {
      setErro("");
      await MensalidadeService.marcarComoPago(id);
      await carregarMensalidades();
      toast.success("Mensalidade marcada como paga.");
    } catch (error) {
      const mensagem = getApiErrorMessage(error, "Erro ao marcar como pago.");
      setErro(mensagem);
      toast.error(mensagem);
    }
  }

  async function handleConfirmarMotivo(motivo: string) {
    if (!acaoComMotivo) return;

    try {
      setEnviandoMotivo(true);
      setErro("");

      if (acaoComMotivo.tipo === "CANCELAR") {
        await MensalidadeService.cancelar(acaoComMotivo.id, motivo);
        toast.success("Mensalidade cancelada.");
      } else {
        await MensalidadeService.estornar(acaoComMotivo.id, motivo);
        toast.success("Mensalidade estornada.");
      }

      await carregarMensalidades();
      setAcaoComMotivo(null);
    } catch (error) {
      const mensagem = getApiErrorMessage(
        error,
        acaoComMotivo.tipo === "CANCELAR" ? "Erro ao cancelar mensalidade." : "Erro ao estornar mensalidade."
      );
      setErro(mensagem);
      toast.error(mensagem);
    } finally {
      setEnviandoMotivo(false);
    }
  }

  const totalPendente = mensalidades
    .filter((m) => !m.pago && calcularStatusMensalidade(m) !== "CANCELADA" && calcularStatusMensalidade(m) !== "ESTORNADA")
    .reduce((sum, m) => sum + m.valorFinal, 0);
  const totalPago = mensalidades
    .filter((m) => m.pago)
    .reduce((sum, m) => sum + m.valorFinal, 0);

  return (
    <Layout>
      <PageHeader
        title="Mensalidades"
        subtitle="Gestão de mensalidades dos alunos."
      />
      <div className="mensalidades-kpis">
        <Card
          titulo="Total Pendente"
          valor={`R$ ${totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
        <Card
          titulo="Total Recebido"
          valor={`R$ ${totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
        <Card
          titulo="Total Geral"
          valor={`R$ ${(totalPendente + totalPago).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
      </div>
      <div className="mensalidades-toolbar">
        <Input
          label="Buscar aluno"
          placeholder="Digite o nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <Button type="button" onClick={() => navigate("/mensalidades/novo")}>
          + Nova Mensalidade
        </Button>
      </div>
      <div className="mensalidades-filtros">
        {(["TODAS", "PENDENTE", "VENCIDA", "PAGA", "CANCELADA", "ESTORNADA"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFiltro(f)}
            className={`mensalidades-filtro ${filtro === f ? "mensalidades-filtro-ativo" : ""}`}
          >
            {f}
          </button>
        ))}
      </div>
      <ErrorMessage message={erro} />
      {loading ? (
        <Loading />
      ) : mensalidadesFiltradas.length === 0 ? (
        <EmptyState
          title="Nenhuma mensalidade encontrada"
          description="Ajuste os filtros ou cadastre uma nova mensalidade."
        />
      ) : (
        <>
          <div className="mensalidades-grid">
            {paginacao.itensDaPagina.map((mensalidade) => (
              <MensalidadeCard
                key={mensalidade.id}
                mensalidade={mensalidade}
                onEditar={(id) => navigate(`/mensalidades/${id}`)}
                onMarcarComoPago={handleMarcarComoPago}
                onCancelar={(id) => setAcaoComMotivo({ tipo: "CANCELAR", id })}
                onEstornar={(id) => setAcaoComMotivo({ tipo: "ESTORNAR", id })}
              />
            ))}
          </div>

          <Pagination
            paginaAtual={paginacao.paginaAtual}
            totalPaginas={paginacao.totalPaginas}
            totalItens={paginacao.totalItens}
            itensPorPagina={paginacao.itensPorPagina}
            onChangePagina={paginacao.irParaPagina}
          />
        </>
      )}

      <MotivoModal
        open={!!acaoComMotivo}
        title={acaoComMotivo?.tipo === "CANCELAR" ? "Cancelar Mensalidade" : "Estornar Mensalidade"}
        label={acaoComMotivo?.tipo === "CANCELAR" ? "Motivo do cancelamento" : "Motivo do estorno"}
        loading={enviandoMotivo}
        onClose={() => setAcaoComMotivo(null)}
        onConfirm={handleConfirmarMotivo}
      />
    </Layout>
  );
}
