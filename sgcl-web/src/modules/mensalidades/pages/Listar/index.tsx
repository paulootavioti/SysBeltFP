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
import { useMensalidades } from "../../hooks/useMensalidades";
import { MensalidadeService } from "../../services/MensalidadeService";
import { MensalidadeCard } from "../../components/MensalidadeCard";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import { calcularStatusMensalidade } from "../../utils/status";
import "./styles.css";
export function ListarMensalidades() {
  const navigate = useNavigate();
  const { mensalidades, loading, erro, setErro, carregarMensalidades } = useMensalidades();
  const [filtro, setFiltro] = useState<"TODAS" | "PENDENTE" | "VENCIDA" | "PAGA">("TODAS");
  const [busca, setBusca] = useState("");
  const mensalidadesFiltradas = mensalidades
    .filter((m) => {
      const status = calcularStatusMensalidade(m);
      if (filtro === "TODAS") return true;
      return status === filtro;
    })
    .filter((m) =>
      m.aluno?.nome.toLowerCase().includes(busca.toLowerCase())
    );
  async function handleMarcarComoPago(id: number) {
    try {
      setErro("");
      await MensalidadeService.marcarComoPago(id);
      await carregarMensalidades();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao marcar como pago."));
    }
  }
  const totalPendente = mensalidades
    .filter((m) => !m.pago)
    .reduce((sum, m) => sum + m.valor, 0);
  const totalPago = mensalidades
    .filter((m) => m.pago)
    .reduce((sum, m) => sum + m.valor, 0);
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
        {(["TODAS", "PENDENTE", "VENCIDA", "PAGA"] as const).map((f) => (
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
        <div className="mensalidades-grid">
          {mensalidadesFiltradas.map((mensalidade) => (
            <MensalidadeCard
              key={mensalidade.id}
              mensalidade={mensalidade}
              onEditar={(id) => navigate(`/mensalidades/${id}`)}
              onMarcarComoPago={handleMarcarComoPago}
            />
          ))}
        </div>
      )}
    </Layout>
  );
}