import { useState } from "react";

import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { Textarea } from "../../../components/ui/Textarea";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";

import { GraduacaoService } from "../services/GraduacaoService";
import { useToast } from "../../../contexts/toast/useToast";
import { getApiErrorMessage } from "../../../shared/utils/getApiErrorMessage";
import { formatarData } from "../utils/helpers";
import type { Graduacao } from "../types";

interface SolicitacoesPendentesGraduacaoProps {
  solicitacoes: Graduacao[];
  onAtualizar: () => void;
}

export function SolicitacoesPendentesGraduacao({ solicitacoes, onAtualizar }: SolicitacoesPendentesGraduacaoProps) {
  const toast = useToast();
  const [aprovando, setAprovando] = useState<Graduacao | null>(null);
  const [rejeitando, setRejeitando] = useState<Graduacao | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");

  if (solicitacoes.length === 0) return null;

  async function confirmarAprovacao() {
    if (!aprovando) return;

    try {
      setProcessando(true);
      setErro("");
      await GraduacaoService.aprovar(aprovando.id);
      toast.success(`Graduação de ${aprovando.aluno?.nome} aprovada.`);
      setAprovando(null);
      onAtualizar();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao aprovar solicitação."));
    } finally {
      setProcessando(false);
    }
  }

  async function confirmarRejeicao() {
    if (!rejeitando) return;

    try {
      setProcessando(true);
      setErro("");
      await GraduacaoService.rejeitar(rejeitando.id, motivoRejeicao.trim() || undefined);
      toast.success(`Solicitação de ${rejeitando.aluno?.nome} rejeitada.`);
      setRejeitando(null);
      setMotivoRejeicao("");
      onAtualizar();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao rejeitar solicitação."));
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div className="graduacoes-pendentes">
      <h2>Solicitações pendentes</h2>

      <ErrorMessage message={erro} />

      <div className="graduacoes-pendentes-lista">
        {solicitacoes.map((solicitacao) => (
          <div key={solicitacao.id} className="graduacoes-pendente-card">
            <div>
              <strong>{solicitacao.aluno?.nome}</strong>
              <span className="graduacoes-pendente-faixa">→ {solicitacao.faixa}</span>
              <p className="graduacoes-pendente-meta">
                Solicitado por {solicitacao.solicitadoPor?.apelido || solicitadoPorFallback(solicitacao)} em{" "}
                {formatarData(solicitacao.data)}
              </p>
              {solicitacao.comentario && <p className="graduacoes-pendente-comentario">"{solicitacao.comentario}"</p>}
            </div>

            <div className="graduacoes-pendente-acoes">
              <Button type="button" size="sm" onClick={() => setAprovando(solicitacao)}>
                Aprovar
              </Button>
              <Button type="button" size="sm" variant="danger" onClick={() => setRejeitando(solicitacao)}>
                Rejeitar
              </Button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={aprovando !== null}
        title="Aprovar graduação"
        message={
          aprovando
            ? `Aprovar a graduação de ${aprovando.aluno?.nome} para ${aprovando.faixa}? O aluno será promovido imediatamente.`
            : ""
        }
        confirmLabel="Aprovar"
        variant="primary"
        loading={processando}
        onConfirm={confirmarAprovacao}
        onCancel={() => setAprovando(null)}
      />

      <Modal
        open={rejeitando !== null}
        title="Rejeitar solicitação"
        onClose={() => {
          setRejeitando(null);
          setMotivoRejeicao("");
        }}
      >
        <Textarea
          label="Motivo (opcional)"
          placeholder="Explique por que a solicitação está sendo rejeitada..."
          rows={4}
          value={motivoRejeicao}
          onChange={(e) => setMotivoRejeicao(e.target.value)}
        />

        <Button type="button" variant="danger" disabled={processando} onClick={confirmarRejeicao}>
          {processando ? "Rejeitando..." : "Rejeitar"}
        </Button>
      </Modal>
    </div>
  );
}

function solicitadoPorFallback(solicitacao: Graduacao): string {
  return solicitacao.solicitadoPor?.nome || "um professor";
}
