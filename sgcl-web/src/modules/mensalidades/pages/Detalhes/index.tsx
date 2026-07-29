import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Card } from "../../../../components/ui/Card";
import { Button } from "../../../../components/ui/Button";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { Loading } from "../../../../components/ui/Loading";
import { StatusBadge } from "../../../../components/ui/StatusBadge";
import { ImageUpload } from "../../../../components/ui/ImageUpload";
import { useAuth } from "../../../../contexts/useAuth";
import { MensalidadeService } from "../../services/MensalidadeService";
import { MotivoModal } from "../../components/MotivoModal";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import { calcularStatusMensalidade } from "../../utils/status";
import { nomeFormaPagamento } from "../../../formasPagamento/types";
import type { MensalidadeComAluno } from "../../types";
import "./styles.css";
function formatarData(data: string): string {
  return new Date(data).toLocaleDateString("pt-BR");
}
function formatarMoeda(valor: number): string {
  return `R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
const STATUS_BADGE = {
  PAGA: "PAGO",
  PENDENTE: "PENDENTE",
  VENCIDA: "VENCIDO",
  CANCELADA: "CANCELADO",
  ESTORNADA: "ESTORNADO",
} as const;
type AcaoComMotivo = "CANCELAR" | "ESTORNAR" | null;
export function DetalheMensalidade() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const ehAdmin = usuario?.perfil === "ADMIN";
  const [mensalidade, setMensalidade] = useState<MensalidadeComAluno | null>(null);
  const [loading, setLoading] = useState(true);
  const [marcandoPago, setMarcandoPago] = useState(false);
  const [erro, setErro] = useState("");
  const [acaoComMotivo, setAcaoComMotivo] = useState<AcaoComMotivo>(null);
  const [enviandoMotivo, setEnviandoMotivo] = useState(false);

  async function recarregar() {
    if (!id) return;
    const data = await MensalidadeService.buscar(Number(id));
    setMensalidade(data);
  }

  useEffect(() => {
    async function carregarMensalidade() {
      try {
        await recarregar();
      } catch (error) {
        setErro(getApiErrorMessage(error, "Erro ao carregar mensalidade."));
      } finally {
        setLoading(false);
      }
    }
    carregarMensalidade();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleMarcarComoPago() {
    try {
      if (!mensalidade) return;
      setMarcandoPago(true);
      setErro("");
      await MensalidadeService.marcarComoPago(mensalidade.id, mensalidade.formaPagamentoId);
      await recarregar();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao marcar como pago."));
    } finally {
      setMarcandoPago(false);
    }
  }

  async function handleConfirmarMotivo(motivo: string) {
    if (!mensalidade || !acaoComMotivo) return;

    try {
      setEnviandoMotivo(true);
      setErro("");

      if (acaoComMotivo === "CANCELAR") {
        await MensalidadeService.cancelar(mensalidade.id, motivo);
      } else {
        await MensalidadeService.estornar(mensalidade.id, motivo);
      }

      await recarregar();
      setAcaoComMotivo(null);
    } catch (error) {
      setErro(
        getApiErrorMessage(
          error,
          acaoComMotivo === "CANCELAR" ? "Erro ao cancelar mensalidade." : "Erro ao estornar mensalidade."
        )
      );
    } finally {
      setEnviandoMotivo(false);
    }
  }

  async function handleComprovanteEnviado(url: string | undefined) {
    if (!mensalidade || !url) return;

    try {
      setErro("");
      await MensalidadeService.registrarComprovante(mensalidade.id, url);
      await recarregar();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao registrar o comprovante."));
    }
  }

  if (loading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }
  if (!mensalidade) {
    return (
      <Layout>
        <PageHeader title="Mensalidade" subtitle="Detalhes da mensalidade." />
        <ErrorMessage message={erro || "Mensalidade não encontrada."} />
        <Button type="button" variant="secondary" onClick={() => navigate("/mensalidades")}>
          Voltar
        </Button>
      </Layout>
    );
  }
  const status = calcularStatusMensalidade(mensalidade);
  const podeEditarValores = status !== "CANCELADA" && status !== "ESTORNADA";
  return (
    <Layout>
      <PageHeader
        title={`Mensalidade - ${mensalidade.aluno?.nome}`}
        subtitle="Detalhes da mensalidade."
      />
      <ErrorMessage message={erro} />
      <div className="mensalidade-detalhe-card">
        <div className="mensalidade-detalhe-header">
          <h2>Detalhes</h2>
          <StatusBadge status={STATUS_BADGE[status]} />
        </div>
        <div className="mensalidade-detalhe-grid">
          <div>
            <p>Aluno</p>
            <strong>{mensalidade.aluno?.nome}</strong>
          </div>
          <div>
            <p>Faixa</p>
            <strong>{mensalidade.aluno?.faixa}</strong>
          </div>
          <div>
            <p>Descrição</p>
            <strong>{mensalidade.descricao || "Mensalidade"}</strong>
          </div>
          {mensalidade.formaPagamento && (
            <div>
              <p>Forma de Pagamento</p>
              <strong>{nomeFormaPagamento(mensalidade.formaPagamento)}</strong>
            </div>
          )}
        </div>
        <div className="mensalidade-detalhe-kpis">
          <Card titulo="Valor Original" valor={formatarMoeda(mensalidade.valorOriginal || mensalidade.valor)} />
          {(mensalidade.desconto > 0 || mensalidade.acrescimo > 0 || mensalidade.multa > 0 || mensalidade.juros > 0) && (
            <Card
              titulo="Ajustes"
              valor={`- ${formatarMoeda(mensalidade.desconto)} / + ${formatarMoeda(
                mensalidade.acrescimo + mensalidade.multa + mensalidade.juros
              )}`}
            />
          )}
          <Card titulo="Valor Final" valor={formatarMoeda(mensalidade.valorFinal || mensalidade.valor)} />
          <Card titulo="Vencimento" valor={formatarData(mensalidade.vencimento)} />
          {mensalidade.dataPagamento && (
            <Card titulo="Data de Pagamento" valor={formatarData(mensalidade.dataPagamento)} />
          )}
        </div>
        {status === "CANCELADA" && mensalidade.motivoCancelamento && (
          <p className="mensalidade-detalhe-motivo">Motivo do cancelamento: {mensalidade.motivoCancelamento}</p>
        )}
        {status === "ESTORNADA" && mensalidade.motivoEstorno && (
          <p className="mensalidade-detalhe-motivo">Motivo do estorno: {mensalidade.motivoEstorno}</p>
        )}
        {podeEditarValores && (
          <div className="mensalidade-detalhe-comprovante">
            <ImageUpload
              label="Comprovante de Pagamento"
              valorAtual={mensalidade.comprovanteUrl}
              prefixo="financeiro"
              onChange={handleComprovanteEnviado}
            />
          </div>
        )}
        {mensalidade.assinaturaId && (
          <p className="mensalidade-detalhe-recorrente">
            🔁 Gerada automaticamente pela assinatura recorrente #{mensalidade.assinaturaId}
          </p>
        )}
        <p className="mensalidade-detalhe-id">ID da Mensalidade: {mensalidade.id}</p>
        <div className="mensalidade-detalhe-acoes">
          {!mensalidade.pago && status !== "PAGA" && status !== "CANCELADA" && status !== "ESTORNADA" && (
            <Button type="button" onClick={handleMarcarComoPago} disabled={marcandoPago}>
              {marcandoPago ? "Marcando..." : "✓ Marcar como Pago"}
            </Button>
          )}
          {ehAdmin && status === "PAGA" && (
            <Button type="button" variant="danger" onClick={() => setAcaoComMotivo("ESTORNAR")}>
              Estornar
            </Button>
          )}
          {ehAdmin && status !== "PAGA" && status !== "CANCELADA" && status !== "ESTORNADA" && (
            <Button type="button" variant="danger" onClick={() => setAcaoComMotivo("CANCELAR")}>
              Cancelar
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={() => navigate("/mensalidades")}>
            Fechar
          </Button>
        </div>
      </div>

      <MotivoModal
        open={!!acaoComMotivo}
        title={acaoComMotivo === "CANCELAR" ? "Cancelar Mensalidade" : "Estornar Mensalidade"}
        label={acaoComMotivo === "CANCELAR" ? "Motivo do cancelamento" : "Motivo do estorno"}
        loading={enviandoMotivo}
        onClose={() => setAcaoComMotivo(null)}
        onConfirm={handleConfirmarMotivo}
      />
    </Layout>
  );
}
