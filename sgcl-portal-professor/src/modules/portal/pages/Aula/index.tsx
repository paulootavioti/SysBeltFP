import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Loading } from "../../../../components/ui/Loading";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { Button } from "../../../../components/ui/Button";
import { BottomSheet } from "../../../../components/ui/BottomSheet";

import { PortalProfessorService } from "../../services/PortalProfessorService";
import { getApiErrorMessage } from "../../../../utils/getApiErrorMessage";
import { useCronometro } from "../../hooks/useCronometro";
import { useWakeLock } from "../../hooks/useWakeLock";
import { useSincronizarFila } from "../../hooks/useSincronizarFila";
import { lerEstadoAula, salvarEstadoAula, limparEstadoAula } from "../../utils/estadoAula";
import type { AulaDetalhe } from "../../types";

import { AulaHeader } from "./components/AulaHeader";
import { AulaRodape } from "./components/AulaRodape";
import { Etapa1Presenca } from "./components/Etapa1Presenca";
import { Etapa2Plano } from "./components/Etapa2Plano";
import { Etapa3Notas } from "./components/Etapa3Notas";
import { Etapa4Foto } from "./components/Etapa4Foto";

import "./styles.css";

export function Aula() {
  const { id } = useParams<{ id: string }>();
  const aulaId = Number(id);
  const navigate = useNavigate();

  const [aula, setAula] = useState<AulaDetalhe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [etapa, setEtapa] = useState(1);
  const [iniciadoEm, setIniciadoEm] = useState(Date.now());
  const [confirmSairAberto, setConfirmSairAberto] = useState(false);
  const [finalizando, setFinalizando] = useState(false);

  const tempo = useCronometro(iniciadoEm);
  const { enfileirarSeOffline } = useSincronizarFila();
  useWakeLock(!!aula && aula.status !== "FINALIZADA");

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aulaId]);

  useEffect(() => {
    if (!aula || aula.status === "FINALIZADA") return;
    salvarEstadoAula({ aulaId, etapa, iniciadoEm });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapa, aula?.status]);

  async function carregar() {
    try {
      setCarregando(true);
      setErro("");
      const resultado = await PortalProfessorService.aula(aulaId);
      setAula(resultado);

      const estadoSalvo = lerEstadoAula(aulaId);
      if (estadoSalvo) {
        setEtapa(estadoSalvo.etapa);
        setIniciadoEm(estadoSalvo.iniciadoEm);
      } else {
        const agora = Date.now();
        setEtapa(1);
        setIniciadoEm(agora);
        salvarEstadoAula({ aulaId, etapa: 1, iniciadoEm: agora });
      }
    } catch (error) {
      setErro(getApiErrorMessage(error, "Não foi possível carregar a aula."));
    } finally {
      setCarregando(false);
    }
  }

  async function handleTogglePresenca(alunoId: number, presente: boolean) {
    if (!aula) return;
    const anterior = aula;

    setAula({
      ...aula,
      alunos: aula.alunos.map((registro) => (registro.alunoId === alunoId ? { ...registro, presente } : registro)),
    });

    try {
      await PortalProfessorService.marcarPresenca(aulaId, alunoId, presente);
    } catch (error) {
      if (!enfileirarSeOffline({ tipo: "presenca", aulaId, payload: { alunoId, presente } }, error)) {
        setAula(anterior);
        setErro(getApiErrorMessage(error, "Não foi possível marcar a presença."));
      }
    }
  }

  async function handleToggleTecnica(tecnicaId: number, executada: boolean) {
    if (!aula) return;
    const anterior = aula;
    const tecnica = aula.aulaCurriculo?.tecnicas.find((item) => item.id === tecnicaId);
    if (!tecnica) return;

    setAula({
      ...aula,
      tecnicasRealizadas: executada
        ? [...aula.tecnicasRealizadas, tecnica]
        : aula.tecnicasRealizadas.filter((item) => item.id !== tecnicaId),
    });

    try {
      await PortalProfessorService.marcarTecnica(aulaId, tecnicaId, executada);
    } catch (error) {
      if (!enfileirarSeOffline({ tipo: "tecnica", aulaId, payload: { tecnicaId, executada } }, error)) {
        setAula(anterior);
        setErro(getApiErrorMessage(error, "Não foi possível registrar a técnica."));
      }
    }
  }

  async function handleSalvarNota(alunoId: number, dados: { tag?: string; texto?: string }) {
    if (!aula) return;
    const nota = await PortalProfessorService.criarNota(aulaId, alunoId, dados);
    setAula({ ...aula, notas: [nota, ...aula.notas] });
  }

  async function handleSalvarObservacao(texto: string) {
    if (!aula) return;
    setAula({ ...aula, observacoes: texto });

    try {
      await PortalProfessorService.registrarObservacao(aulaId, texto);
    } catch (error) {
      enfileirarSeOffline({ tipo: "observacao", aulaId, payload: { texto } }, error);
    }
  }

  async function handlePublicarFoto(arquivo: File, legenda: string, visivelNaLanding: boolean) {
    await PortalProfessorService.publicarFoto(aulaId, arquivo, legenda, visivelNaLanding);
  }

  function handleAvancar() {
    if (etapa < 4) {
      setEtapa(etapa + 1);
    } else {
      handleFinalizar();
    }
  }

  function handleVoltar() {
    if (etapa > 1) setEtapa(etapa - 1);
  }

  async function handleFinalizar() {
    if (!aula) return;
    try {
      setFinalizando(true);
      setErro("");
      const resumo = await PortalProfessorService.finalizar(aulaId, aula.observacoes || undefined);
      limparEstadoAula(aulaId);
      navigate(`/aula/${aulaId}/resumo`, { state: { resumo } });
    } catch (error) {
      setErro(getApiErrorMessage(error, "Não foi possível finalizar a aula."));
    } finally {
      setFinalizando(false);
    }
  }

  function handleConfirmarSair() {
    navigate("/home");
  }

  if (carregando) {
    return (
      <div className="aula-page aula-page-centralizada">
        <Loading message="Carregando aula..." />
      </div>
    );
  }

  if (erro && !aula) {
    return (
      <div className="aula-page aula-page-centralizada">
        <ErrorMessage message={erro} onRetry={carregar} />
        <Button variant="secondary" onClick={() => navigate("/home")}>
          Voltar para Home
        </Button>
      </div>
    );
  }

  if (!aula) return null;

  if (aula.status === "FINALIZADA") {
    return (
      <div className="aula-page aula-page-centralizada">
        <p className="aula-ja-finalizada">Esta aula já foi finalizada.</p>
        <Button onClick={() => navigate("/home")}>Voltar para Home</Button>
      </div>
    );
  }

  const alunosPresentes = aula.alunos.filter((registro) => registro.presente);

  return (
    <div className="aula-page">
      <AulaHeader
        turmaNome={aula.turma?.nome ?? "Turma"}
        planoTitulo={aula.aulaCurriculo?.titulo ?? null}
        tempo={tempo}
        etapaAtual={etapa}
        onEtapaClick={setEtapa}
        onSair={() => setConfirmSairAberto(true)}
      />

      <main className="aula-conteudo">
        {erro && <ErrorMessage message={erro} onRetry={() => setErro("")} retryLabel="Ok" />}

        {etapa === 1 && <Etapa1Presenca alunos={aula.alunos} onTogglePresenca={handleTogglePresenca} />}

        {etapa === 2 && (
          <Etapa2Plano
            aulaCurriculo={aula.aulaCurriculo}
            tecnicasRealizadasIds={aula.tecnicasRealizadas.map((tecnica) => tecnica.id)}
            onToggleTecnica={handleToggleTecnica}
          />
        )}

        {etapa === 3 && (
          <Etapa3Notas
            alunosPresentes={alunosPresentes}
            notas={aula.notas}
            observacao={aula.observacoes ?? ""}
            onSalvarNota={handleSalvarNota}
            onSalvarObservacao={handleSalvarObservacao}
          />
        )}

        {etapa === 4 && (
          <Etapa4Foto
            totalPresentes={alunosPresentes.length}
            horarioInicio={aula.turma?.horarioInicio ?? ""}
            data={aula.data}
            onPublicar={handlePublicarFoto}
          />
        )}
      </main>

      <AulaRodape etapaAtual={etapa} onVoltar={handleVoltar} onAvancar={handleAvancar} finalizando={finalizando} />

      <BottomSheet open={confirmSairAberto} title="Sair da aula?" onClose={() => setConfirmSairAberto(false)}>
        <p className="aula-sair-texto">A presença já marcada fica salva. Você pode retomar depois.</p>
        <div className="aula-sair-acoes">
          <Button variant="secondary" onClick={() => setConfirmSairAberto(false)}>
            Continuar aula
          </Button>
          <Button variant="danger" onClick={handleConfirmarSair}>
            Sair
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
