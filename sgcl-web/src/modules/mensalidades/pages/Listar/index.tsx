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
import { DataTable } from "../../../../components/ui/DataTable";
import { Situacao } from "../../../../components/ui/Situacao";
import { useMensalidades } from "../../hooks/useMensalidades";
import { MensalidadeService } from "../../services/MensalidadeService";
import { MensalidadeCard } from "../../components/MensalidadeCard";
import { MotivoModal } from "../../components/MotivoModal";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import { calcularStatusMensalidade } from "../../utils/status";
import { useToast } from "../../../../contexts/toast/useToast";
import { formatarData } from "../../../../shared/utils/formatarData";
import type { MensalidadeComAluno } from "../../types";
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

  const columns = [
    { header: "Aluno", accessor: "aluno" as const, prioridade: 1 as const, render: (item: MensalidadeComAluno) => item.aluno?.nome ?? "Aluno não informado" },
    { header: "Descrição", accessor: "descricao" as const, prioridade: 2 as const, render: (item: MensalidadeComAluno) => item.descricao || "Mensalidade" },
    { header: "Vencimento", accessor: "vencimento" as const, prioridade: 1 as const, render: (item: MensalidadeComAluno) => formatarData(item.vencimento) },
    { header: "Valor", accessor: "valorFinal" as const, prioridade: 1 as const, render: (item: MensalidadeComAluno) => `R$ ${item.valorFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` },
    { header: "Situação", accessor: "status" as const, prioridade: 1 as const, render: (item: MensalidadeComAluno) => { const status = calcularStatusMensalidade(item); const dias = Math.max(1, Math.floor((Date.now() - new Date(item.vencimento).getTime()) / 86400000)); return <Situacao degrau={status === "VENCIDA" ? "acao" : status === "PENDENTE" ? "atencao" : status === "CANCELADA" || status === "ESTORNADA" ? "inativo" : "neutro"}>{status === "VENCIDA" ? `Vencida há ${dias} dias` : status === "PENDENTE" ? "Pagamento pendente" : status === "PAGA" ? "Em dia" : status}</Situacao>; } },
    { header: "Ação", accessor: "id" as const, prioridade: 1 as const, render: (item: MensalidadeComAluno) => <Button type="button" size="sm" variant="secondary" onClick={() => navigate(`/mensalidades/${item.id}`)}>Abrir</Button> },
  ];

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

  const totalPendente = mensalidadesFiltradas
    .filter((m) => !m.pago && calcularStatusMensalidade(m) !== "CANCELADA" && calcularStatusMensalidade(m) !== "ESTORNADA")
    .reduce((sum, m) => sum + m.valorFinal, 0);
  const totalPago = mensalidadesFiltradas
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
          <DataTable columns={columns} data={mensalidadesFiltradas} pageSize={12} renderCartao={(mensalidade) => <MensalidadeCard mensalidade={mensalidade} onEditar={(id) => navigate(`/mensalidades/${id}`)} onMarcarComoPago={handleMarcarComoPago} onCancelar={(id) => setAcaoComMotivo({ tipo: "CANCELAR", id })} onEstornar={(id) => setAcaoComMotivo({ tipo: "ESTORNAR", id })} />} />
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
