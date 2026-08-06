import { useEffect, useState } from "react";

import { Loading } from "../../../components/ui/Loading";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";

import { PortalService } from "../services/PortalService";
import { getApiErrorMessage } from "../../../utils/getApiErrorMessage";
import type { Mensalidade, ResultadoPagamento } from "../types";
import { formatarData } from "../../../utils/formatarData";

const BADGE_STATUS: Record<string, { label: string; variant: "warning" | "success" | "danger" | "neutral" }> = {
  ABERTA: { label: "Em aberto", variant: "warning" },
  VENCIDA: { label: "Vencida", variant: "danger" },
  PAGA: { label: "Paga", variant: "success" },
  CANCELADA: { label: "Cancelada", variant: "neutral" },
  ESTORNADA: { label: "Estornada", variant: "neutral" },
};

interface MensalidadesTabProps {
  alunoId: number;
}

export function MensalidadesTab({ alunoId }: MensalidadesTabProps) {
  const [mensalidades, setMensalidades] = useState<Mensalidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [pagando, setPagando] = useState<Mensalidade | null>(null);
  const [processando, setProcessando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoPagamento | null>(null);
  const [erroPagamento, setErroPagamento] = useState("");

  function carregar() {
    setLoading(true);
    PortalService.mensalidades(alunoId)
      .then(setMensalidades)
      .catch((error) => setErro(getApiErrorMessage(error, "Não foi possível carregar as mensalidades.")))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alunoId]);

  function fecharModal() {
    setPagando(null);
    setResultado(null);
    setErroPagamento("");
  }

  async function confirmarPagamento() {
    if (!pagando) return;

    try {
      setProcessando(true);
      setErroPagamento("");
      const dados = await PortalService.pagarMensalidade(pagando.id, alunoId);
      setResultado(dados);
    } catch (error) {
      setErroPagamento(getApiErrorMessage(error, "Não foi possível iniciar o pagamento."));
    } finally {
      setProcessando(false);
    }
  }

  if (loading) return <Loading />;
  if (erro) return <ErrorMessage message={erro} />;

  if (mensalidades.length === 0) {
    return <EmptyState title="Nenhuma mensalidade" description="Ainda não há mensalidades geradas." />;
  }

  return (
    <div className="mensalidades-tab-lista">
      {mensalidades.map((mensalidade) => {
        const badge = BADGE_STATUS[mensalidade.status];
        const podePagar = mensalidade.status === "ABERTA" || mensalidade.status === "VENCIDA";

        return (
          <div key={mensalidade.id} className="mensalidades-tab-item">
            <div>
              <strong>{mensalidade.descricao || "Mensalidade"}</strong>
              <span>
                R$ {mensalidade.valor.toFixed(2)} — vence em{" "}
                {formatarData(mensalidade.vencimento)}
              </span>
            </div>

            <div className="mensalidades-tab-acoes">
              <Badge variant={badge.variant}>{badge.label}</Badge>

              {podePagar && (
                <Button type="button" size="sm" onClick={() => setPagando(mensalidade)}>
                  Pagar agora
                </Button>
              )}
            </div>
          </div>
        );
      })}

      <Modal open={pagando !== null} title="Pagar mensalidade" onClose={fecharModal}>
        {resultado ? (
          <div className="mensalidades-tab-confirmacao">
            <p>Cobrança iniciada com sucesso.</p>
            <p className="mensalidades-tab-confirmacao-nota">
              Ainda não temos um gateway de pagamento integrado (TODO da equipe de produto/infra) — a confirmação é
              manual. Assim que o pagamento for recebido, nossa equipe atualiza o status por aqui.
            </p>
            <Button type="button" onClick={fecharModal}>
              Fechar
            </Button>
          </div>
        ) : (
          <div className="mensalidades-tab-confirmacao">
            <p>
              Confirmar o pagamento de{" "}
              <strong>R$ {pagando?.valor.toFixed(2)}</strong> referente a{" "}
              {pagando?.descricao || "esta mensalidade"}?
            </p>

            <ErrorMessage message={erroPagamento} />

            <Button type="button" disabled={processando} onClick={confirmarPagamento}>
              {processando ? "Processando..." : "Confirmar pagamento"}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
