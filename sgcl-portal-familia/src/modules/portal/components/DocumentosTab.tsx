import { useEffect, useState } from "react";
import { LuExternalLink, LuFileCheck2, LuPenLine } from "react-icons/lu";

import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { Loading } from "../../../components/ui/Loading";
import { Modal } from "../../../components/ui/Modal";
import { formatarData } from "../../../utils/formatarData";
import { getApiErrorMessage } from "../../../utils/getApiErrorMessage";
import { PortalService } from "../services/PortalService";
import type { ContratoFamilia, SituacaoContrato } from "../types";

const STATUS: Record<SituacaoContrato, { texto: string; variante: "warning" | "success" | "danger" | "neutral" }> = {
  PENDENTE_ASSINATURA: { texto: "Aguardando assinatura", variante: "warning" },
  ASSINADO: { texto: "Assinado", variante: "success" },
  ATIVO: { texto: "Ativo", variante: "success" },
  SUSPENSO: { texto: "Suspenso", variante: "warning" },
  CANCELADO: { texto: "Cancelado", variante: "danger" },
  ENCERRADO: { texto: "Encerrado", variante: "neutral" },
  RENOVADO: { texto: "Renovado", variante: "neutral" },
};

export function DocumentosTab({ alunoId }: { alunoId: number }) {
  const [contratos, setContratos] = useState<ContratoFamilia[]>([]);
  const [selecionado, setSelecionado] = useState<ContratoFamilia | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    setLoading(true);
    PortalService.contratos(alunoId)
      .then(setContratos)
      .catch((error) => setErro(getApiErrorMessage(error, "Não foi possível carregar os documentos.")))
      .finally(() => setLoading(false));
  }, [alunoId]);

  if (loading) return <Loading />;
  if (erro) return <ErrorMessage message={erro} />;
  if (contratos.length === 0) return <EmptyState title="Nenhum documento disponível" description="Os contratos enviados pela academia aparecerão aqui." />;

  return <div className="documentos-lista">
    {contratos.map((contrato) => {
      const status = STATUS[contrato.situacao];
      const solicitacao = contrato.solicitacoesAssinatura[0];
      const documento = contrato.contratoAssinadoUrl ?? solicitacao?.documentoAssinadoUrl;
      return <article key={contrato.id} className="documento-item">
        <div className="documento-icone"><LuFileCheck2 aria-hidden /></div>
        <div className="documento-info">
          <strong>Contrato nº {contrato.numero}</strong>
          <span>{contrato.modeloContrato.nome} · início em {formatarData(contrato.dataInicioVigencia)}</span>
        </div>
        <Badge variant={status.variante}>{status.texto}</Badge>
        <div className="documento-acoes">
          <Button size="sm" variant="secondary" onClick={() => setSelecionado(contrato)}>Visualizar</Button>
          {solicitacao?.linkAssinatura && contrato.situacao === "PENDENTE_ASSINATURA" && <a className="button button-primary button-sm" href={solicitacao.linkAssinatura} target="_blank" rel="noreferrer"><LuPenLine aria-hidden /> Assinar</a>}
          {documento && <a className="button button-secondary button-sm" href={documento} target="_blank" rel="noreferrer"><LuExternalLink aria-hidden /> Abrir assinado</a>}
        </div>
      </article>;
    })}

    <Modal open={selecionado !== null} title={selecionado ? `Contrato nº ${selecionado.numero}` : "Contrato"} onClose={() => setSelecionado(null)}>
      {selecionado && <div className="documento-conteudo">
        <div><span>Vigência</span><strong>{formatarData(selecionado.dataInicioVigencia)}{selecionado.dataFimVigencia ? ` a ${formatarData(selecionado.dataFimVigencia)}` : ""}</strong></div>
        <pre>{selecionado.conteudoGerado}</pre>
      </div>}
    </Modal>
  </div>;
}
