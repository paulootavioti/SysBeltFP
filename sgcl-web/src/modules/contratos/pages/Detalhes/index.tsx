import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Button } from "../../../../components/ui/Button";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { Loading } from "../../../../components/ui/Loading";
import { Badge } from "../../../../components/ui/Badge";
import { Modal } from "../../../../components/ui/Modal";
import { useAuth } from "../../../../contexts/useAuth";
import { useToast } from "../../../../contexts/toast/useToast";

import { ContratoService } from "../../services/ContratoService";
import { ContratoForm } from "../../components/ContratoForm";
import { AssinarModal } from "../../components/AssinarModal";
import { MotivoModal } from "../../../mensalidades/components/MotivoModal";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import { formatarData, formatarMoeda } from "../../../dashboard/utils/formatters";
import {
  SITUACAO_CONTRATO_LABEL,
  TIPO_ASSINATURA_LABEL,
  type Contrato,
  type SituacaoContrato,
  type TipoAssinaturaContrato,
} from "../../types";
import type { ContratoFormData } from "../../schema/contrato.schema";

import "./styles.css";

const VARIANTE_SITUACAO: Record<SituacaoContrato, "success" | "warning" | "danger" | "neutral" | "info"> = {
  RASCUNHO: "neutral",
  PENDENTE_ASSINATURA: "warning",
  ASSINADO: "info",
  ATIVO: "success",
  SUSPENSO: "warning",
  CANCELADO: "danger",
  ENCERRADO: "neutral",
  RENOVADO: "neutral",
};

export function DetalheContrato() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const toast = useToast();
  const ehAdmin = usuario?.perfil === "ADMIN";

  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [processando, setProcessando] = useState(false);

  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [modalAssinarAberto, setModalAssinarAberto] = useState(false);
  const [modalCancelarAberto, setModalCancelarAberto] = useState(false);

  async function recarregar() {
    if (!id) return;
    const data = await ContratoService.buscar(Number(id));
    setContrato(data);
  }

  useEffect(() => {
    async function carregar() {
      try {
        await recarregar();
      } catch (error) {
        setErro(getApiErrorMessage(error, "Erro ao carregar contrato."));
      } finally {
        setLoading(false);
      }
    }
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleEditar(data: ContratoFormData) {
    if (!contrato) return;
    try {
      setProcessando(true);
      setErro("");
      await ContratoService.editar(contrato.id, data);
      toast.success("Contrato atualizado com sucesso.");
      await recarregar();
      setModalEditarAberto(false);
    } catch (error) {
      const mensagem = getApiErrorMessage(error, "Erro ao atualizar contrato.");
      setErro(mensagem);
      toast.error(mensagem);
    } finally {
      setProcessando(false);
    }
  }

  async function handleAlterarSituacao(situacao: SituacaoContrato, motivoCancelamento?: string) {
    if (!contrato) return;
    try {
      setProcessando(true);
      setErro("");
      await ContratoService.alterarSituacao(contrato.id, situacao, motivoCancelamento);
      toast.success("Situação do contrato atualizada.");
      await recarregar();
      setModalCancelarAberto(false);
    } catch (error) {
      const mensagem = getApiErrorMessage(error, "Erro ao alterar situação do contrato.");
      setErro(mensagem);
      toast.error(mensagem);
    } finally {
      setProcessando(false);
    }
  }

  async function handleAssinar(tipoAssinatura: TipoAssinaturaContrato, contratoAssinadoUrl?: string) {
    if (!contrato) return;
    try {
      setProcessando(true);
      setErro("");
      await ContratoService.assinar(contrato.id, tipoAssinatura, contratoAssinadoUrl);
      toast.success("Assinatura registrada com sucesso.");
      await recarregar();
      setModalAssinarAberto(false);
    } catch (error) {
      const mensagem = getApiErrorMessage(error, "Erro ao registrar assinatura.");
      setErro(mensagem);
      toast.error(mensagem);
    } finally {
      setProcessando(false);
    }
  }

  async function handleRenovar() {
    if (!contrato) return;
    try {
      setProcessando(true);
      setErro("");
      const novo = await ContratoService.renovar(contrato.id);
      toast.success(`Contrato renovado. Novo contrato: nº ${novo.numero}.`);
      navigate(`/contratos/${novo.id}`);
    } catch (error) {
      const mensagem = getApiErrorMessage(error, "Erro ao renovar contrato.");
      setErro(mensagem);
      toast.error(mensagem);
    } finally {
      setProcessando(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  if (!contrato) {
    return (
      <Layout>
        <PageHeader title="Contrato" subtitle="Detalhes do contrato." />
        <ErrorMessage message={erro || "Contrato não encontrado."} />
        <Button type="button" variant="secondary" onClick={() => navigate("/contratos")}>
          Voltar
        </Button>
      </Layout>
    );
  }

  const contratanteNome = contrato.contratanteResponsavel?.nome ?? contrato.aluno?.nome;

  return (
    <Layout>
      <PageHeader title={`Contrato nº ${contrato.numero}`} subtitle={`Aluno: ${contrato.aluno?.nome}`} />
      <ErrorMessage message={erro} />

      <div className="contrato-detalhe-card">
        <div className="contrato-detalhe-header">
          <h2>Detalhes</h2>
          <Badge variant={VARIANTE_SITUACAO[contrato.situacao]}>{SITUACAO_CONTRATO_LABEL[contrato.situacao]}</Badge>
        </div>

        <div className="contrato-detalhe-grid">
          <div>
            <p>Contratante</p>
            <strong>{contratanteNome}</strong>
          </div>
          <div>
            <p>Modelo</p>
            <strong>{contrato.modeloContrato?.nome}</strong>
          </div>
          {contrato.plano && (
            <div>
              <p>Plano</p>
              <strong>{contrato.plano.nome}</strong>
            </div>
          )}
          <div>
            <p>Valor</p>
            <strong>{formatarMoeda(contrato.valor)}</strong>
          </div>
          <div>
            <p>Início da Vigência</p>
            <strong>{formatarData(contrato.dataInicioVigencia)}</strong>
          </div>
          {contrato.dataFimVigencia && (
            <div>
              <p>Fim da Vigência</p>
              <strong>{formatarData(contrato.dataFimVigencia)}</strong>
            </div>
          )}
          {contrato.tipoAssinatura && (
            <div>
              <p>Assinatura</p>
              <strong>{TIPO_ASSINATURA_LABEL[contrato.tipoAssinatura]}</strong>
            </div>
          )}
        </div>

        {contrato.situacao === "CANCELADO" && contrato.motivoCancelamento && (
          <p className="contrato-detalhe-motivo">Motivo do cancelamento: {contrato.motivoCancelamento}</p>
        )}

        {contrato.contratoAnteriorId && (
          <p className="contrato-detalhe-renovacao">
            🔁 Este contrato é uma renovação do contrato #{contrato.contratoAnteriorId}
          </p>
        )}
        {contrato.renovacoes && contrato.renovacoes.length > 0 && (
          <p className="contrato-detalhe-renovacao">
            Renovado pelo contrato nº {contrato.renovacoes[0].numero}
          </p>
        )}

        <div className="contrato-detalhe-conteudo">{contrato.conteudoGerado}</div>

        {ehAdmin && (
          <div className="contrato-detalhe-acoes">
            {contrato.situacao === "RASCUNHO" && (
              <>
                <Button type="button" variant="secondary" onClick={() => setModalEditarAberto(true)}>
                  Editar
                </Button>
                <Button type="button" disabled={processando} onClick={() => handleAlterarSituacao("PENDENTE_ASSINATURA")}>
                  Enviar para Assinatura
                </Button>
                <Button type="button" variant="danger" onClick={() => setModalCancelarAberto(true)}>
                  Cancelar
                </Button>
              </>
            )}

            {contrato.situacao === "PENDENTE_ASSINATURA" && (
              <>
                <Button type="button" disabled={processando} onClick={() => setModalAssinarAberto(true)}>
                  Registrar Assinatura
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={processando}
                  onClick={() => handleAlterarSituacao("RASCUNHO")}
                >
                  Voltar para Rascunho
                </Button>
                <Button type="button" variant="danger" onClick={() => setModalCancelarAberto(true)}>
                  Cancelar
                </Button>
              </>
            )}

            {contrato.situacao === "ASSINADO" && (
              <>
                <Button type="button" disabled={processando} onClick={() => handleAlterarSituacao("ATIVO")}>
                  Ativar Contrato
                </Button>
                <Button type="button" variant="danger" onClick={() => setModalCancelarAberto(true)}>
                  Cancelar
                </Button>
              </>
            )}

            {contrato.situacao === "ATIVO" && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={processando}
                  onClick={() => handleAlterarSituacao("SUSPENSO")}
                >
                  Suspender
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={processando}
                  onClick={() => handleAlterarSituacao("ENCERRADO")}
                >
                  Encerrar
                </Button>
                <Button type="button" disabled={processando} onClick={handleRenovar}>
                  Renovar
                </Button>
                <Button type="button" variant="danger" onClick={() => setModalCancelarAberto(true)}>
                  Cancelar
                </Button>
              </>
            )}

            {contrato.situacao === "SUSPENSO" && (
              <>
                <Button type="button" disabled={processando} onClick={() => handleAlterarSituacao("ATIVO")}>
                  Reativar
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={processando}
                  onClick={() => handleAlterarSituacao("ENCERRADO")}
                >
                  Encerrar
                </Button>
                <Button type="button" disabled={processando} onClick={handleRenovar}>
                  Renovar
                </Button>
                <Button type="button" variant="danger" onClick={() => setModalCancelarAberto(true)}>
                  Cancelar
                </Button>
              </>
            )}

            {contrato.situacao === "ENCERRADO" && (
              <Button type="button" disabled={processando} onClick={handleRenovar}>
                Renovar
              </Button>
            )}
          </div>
        )}

        <Button type="button" variant="secondary" onClick={() => navigate("/contratos")}>
          Voltar
        </Button>
      </div>

      <Modal open={modalEditarAberto} title="Editar Contrato" onClose={() => setModalEditarAberto(false)}>
        <ContratoForm contrato={contrato} loading={processando} onSubmit={handleEditar} />
      </Modal>

      <AssinarModal
        open={modalAssinarAberto}
        loading={processando}
        onClose={() => setModalAssinarAberto(false)}
        onConfirm={handleAssinar}
      />

      <MotivoModal
        open={modalCancelarAberto}
        title="Cancelar Contrato"
        label="Motivo do cancelamento"
        loading={processando}
        onClose={() => setModalCancelarAberto(false)}
        onConfirm={(motivo) => handleAlterarSituacao("CANCELADO", motivo)}
      />
    </Layout>
  );
}
