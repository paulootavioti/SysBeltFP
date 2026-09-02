import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { AulaCurriculoDetalhe, BlocoAulaCompilado, RegistroExecucaoBloco } from "../../../types";
import { lerEstadoAula, salvarEstadoTimerAula, type EstadoTimerAula } from "../../../utils/estadoAula";
import { PortalProfessorService } from "../../../services/PortalProfessorService";
import "./Etapa2Plano.css";

interface Props {
  aulaId: number;
  aulaCurriculo: AulaCurriculoDetalhe | null;
  totalAlunos: number;
  totalPresentes: number;
  registrosExistentes: Array<{ chaveBloco: string }>;
  onRegistrar: (registro: RegistroExecucaoBloco) => Promise<void>;
  onEncerrar: () => void;
  avisoAntesFim?: number;
}

const formatarTempo = (s: number) => `${String(Math.floor(Math.max(0, s) / 60)).padStart(2, "0")}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

function criarEstadoInicial(aulaId: number, blocos: BlocoAulaCompilado[]): EstadoTimerAula {
  const salvo = lerEstadoAula(aulaId)?.timer;
  if (salvo && blocos[salvo.indiceAtual]) {
    const decorrido = salvo.rodando ? Math.floor((Date.now() - salvo.atualizadoEm) / 1000) : 0;
    return {
      ...salvo,
      restanteSegundos: salvo.pausaVoz ? salvo.restanteSegundos : Math.max(0, salvo.restanteSegundos - decorrido),
      pausaVoz: salvo.pausaVoz ? { ...salvo.pausaVoz, restanteSegundos: Math.max(0, salvo.pausaVoz.restanteSegundos - Math.floor((Date.now() - salvo.atualizadoEm) / 1000)) } : undefined,
      atualizadoEm: Date.now(),
    };
  }
  return { indiceAtual: 0, restanteSegundos: blocos[0]?.duracaoPrevistaSegundos ?? 0, rodando: true, atualizadoEm: Date.now(), iniciadoBlocoEm: Date.now(), chavesConcluidas: [] };
}

function emitirAviso(frequencia = 880) {
  try {
    const Janela = window as typeof window & { webkitAudioContext?: typeof AudioContext };
    const AudioContexto = window.AudioContext || Janela.webkitAudioContext;
    if (!AudioContexto) return;
    const contexto = new AudioContexto();
    const oscilador = contexto.createOscillator();
    const ganho = contexto.createGain();
    oscilador.frequency.value = frequencia;
    ganho.gain.setValueAtTime(0.12, contexto.currentTime);
    ganho.gain.exponentialRampToValueAtTime(0.001, contexto.currentTime + 0.25);
    oscilador.connect(ganho).connect(contexto.destination);
    oscilador.start();
    oscilador.stop(contexto.currentTime + 0.25);
  } catch { /* depende da permissão de áudio do navegador */ }
}

export function Etapa2Plano({ aulaId, aulaCurriculo, totalAlunos, totalPresentes, registrosExistentes, onRegistrar, onEncerrar, avisoAntesFim = 10 }: Props) {
  const blocos = useMemo(() => aulaCurriculo?.filaCompilada.blocos ?? [], [aulaCurriculo]);
  const [timer, setTimer] = useState(() => criarEstadoInicial(aulaId, blocos));
  const processando = useRef(false);
  const avisoEmitido = useRef(false);
  const roundAnterior = useRef(1);
  const atual = blocos[timer.indiceAtual];
  const pausaVoz = timer.pausaVoz;
  const duracaoExibida = pausaVoz?.duracaoSegundos ?? atual?.duracaoPrevistaSegundos ?? 1;
  const restanteExibido = pausaVoz?.restanteSegundos ?? timer.restanteSegundos;
  const percentual = Math.max(0, Math.min(100, ((duracaoExibida - restanteExibido) / duracaoExibida) * 100));
  const roundAtual = atual?.tipo === "SPARRING" && atual.rounds && atual.duracaoRoundSegundos
    ? Math.min(atual.rounds, Math.floor((atual.duracaoPrevistaSegundos - timer.restanteSegundos) / (atual.duracaoRoundSegundos + (atual.descansoSegundos ?? 0))) + 1)
    : null;

  useEffect(() => salvarEstadoTimerAula(aulaId, timer), [aulaId, timer]);

  const concluirAtual = useCallback(async (automatico: boolean) => {
    const bloco = blocos[timer.indiceAtual];
    if (!bloco || processando.current) return;
    processando.current = true;
    const finalizadoEm = Date.now();
    const duracaoReal = Math.max(0, Math.round((finalizadoEm - timer.iniciadoBlocoEm) / 1000));
    try {
      await onRegistrar({
        chaveBloco: bloco.chave, tipo: bloco.tipo, nome: bloco.nome, ordem: bloco.ordem,
        duracaoPrevistaSegundos: bloco.duracaoPrevistaSegundos, duracaoRealSegundos: duracaoReal,
        status: !automatico && duracaoReal < 3 ? "PULADO" : "CUMPRIDO",
        iniciadoEm: new Date(timer.iniciadoBlocoEm).toISOString(), finalizadoEm: new Date(finalizadoEm).toISOString(),
        ...(bloco.tecnicaId ? { tecnicaId: bloco.tecnicaId } : {}),
      });
    } catch {
      processando.current = false;
      return;
    }
    emitirAviso(1040);
    const proximoIndice = timer.indiceAtual + 1;
    const proximo = blocos[proximoIndice];
    setTimer({ indiceAtual: proximoIndice, restanteSegundos: proximo?.duracaoPrevistaSegundos ?? 0, rodando: Boolean(proximo), atualizadoEm: finalizadoEm, iniciadoBlocoEm: finalizadoEm, chavesConcluidas: [...new Set([...timer.chavesConcluidas, bloco.chave])] });
    avisoEmitido.current = false;
    processando.current = false;
  }, [blocos, onRegistrar, timer]);

  useEffect(() => {
    if ((!timer.rodando && !timer.pausaVoz) || !atual) return;
    const intervalo = window.setInterval(() => setTimer((estado) => estado.pausaVoz
      ? { ...estado, atualizadoEm: Date.now(), pausaVoz: { ...estado.pausaVoz, restanteSegundos: Math.max(0, estado.pausaVoz.restanteSegundos - 1) } }
      : { ...estado, restanteSegundos: Math.max(0, estado.restanteSegundos - 1), atualizadoEm: Date.now() }), 1000);
    return () => window.clearInterval(intervalo);
  }, [atual, timer.pausaVoz, timer.rodando]);

  useEffect(() => {
    if (avisoAntesFim > 0 && timer.restanteSegundos === avisoAntesFim && !avisoEmitido.current) { avisoEmitido.current = true; emitirAviso(); }
    if (timer.restanteSegundos === 0 && timer.rodando && atual) void concluirAtual(true);
  }, [atual, concluirAtual, timer.restanteSegundos, timer.rodando]);

  useEffect(() => {
    if (roundAtual && roundAtual !== roundAnterior.current) emitirAviso(1040);
    roundAnterior.current = roundAtual ?? 1;
  }, [roundAtual]);

  useEffect(() => {
    if (!pausaVoz) return;
    if (pausaVoz.restanteSegundos === (pausaVoz.avisoAntesFimSegundos ?? avisoAntesFim)) emitirAviso();
    if (pausaVoz.restanteSegundos !== 0 || processando.current) return;
    processando.current = true;
    const fim = Date.now();
    void onRegistrar({ chaveBloco: pausaVoz.chave, tipo: "PAUSA", nome: "Pausa por comando de voz", ordem: timer.indiceAtual, duracaoPrevistaSegundos: pausaVoz.duracaoSegundos, duracaoRealSegundos: Math.round((fim - pausaVoz.iniciadoEm) / 1000), status: "CUMPRIDO", iniciadoEm: new Date(pausaVoz.iniciadoEm).toISOString(), finalizadoEm: new Date(fim).toISOString() }).then(() => {
      setTimer((estado) => ({ ...estado, pausaVoz: undefined, rodando: true, atualizadoEm: Date.now() }));
      processando.current = false;
      emitirAviso(1040);
    }).catch(() => { processando.current = false; });
  }, [onRegistrar, pausaVoz, timer.indiceAtual]);

  useEffect(() => {
    const consultar = async () => {
      try {
        const eventos = await PortalProfessorService.consumirComandosVoz(aulaId);
        for (const evento of eventos) {
          if (evento.acao === "INICIAR") setTimer((estado) => ({ ...estado, rodando: true, atualizadoEm: Date.now() }));
          if (evento.acao === "PAUSAR") setTimer((estado) => ({ ...estado, rodando: false, atualizadoEm: Date.now() }));
          if (evento.acao === "AVANCAR") void concluirAtual(false);
          if (evento.acao === "BLOCO_PAUSA") {
            const duracao = evento.duracaoBlocoSegundos ?? 60;
            setTimer((estado) => ({ ...estado, rodando: false, atualizadoEm: Date.now(), pausaVoz: { chave: `voz:${evento.id}`, duracaoSegundos: duracao, restanteSegundos: duracao, iniciadoEm: Date.now(), avisoAntesFimSegundos: evento.avisoAntesFimSegundos } }));
          }
        }
      } catch { /* o timer local continua funcionando sem conexão */ }
    };
    const intervalo = window.setInterval(() => void consultar(), 2500);
    return () => window.clearInterval(intervalo);
  }, [aulaId, concluirAtual]);

  if (!aulaCurriculo || blocos.length === 0) return <div className="etapa-plano-vazio"><p>Esta aula não tem blocos cronometrados no currículo.</p></div>;
  if (!atual) return <div className="ring-concluido"><strong>Plano concluído</strong><p>Todos os blocos foram registrados.</p><button type="button" className="ring-encerrar" onClick={onEncerrar}>Encerrar aula</button></div>;

  const concluidas = new Set([...timer.chavesConcluidas, ...registrosExistentes.map((item) => item.chaveBloco)]);
  return (
    <div className="ring-timer">
      <section className="ring-destaque" aria-live="polite">
        <p className="ring-etiqueta">{pausaVoz ? "PAUSA · COMANDO DE VOZ" : `${atual.tipo}${roundAtual ? ` · ROUND ${roundAtual}/${atual.rounds}` : ""}${atual.obrigatoria ? " · OBRIGATÓRIA" : ""}`}</p>
        <h2>{pausaVoz ? "Pausa" : atual.nome}</h2>
        <div className="ring-progresso" style={{ "--progresso": `${percentual}%` } as CSSProperties}><div><strong>{formatarTempo(restanteExibido)}</strong><span>restantes</span></div></div>
        <div className="ring-controles">
          <button type="button" disabled={Boolean(pausaVoz)} onClick={() => setTimer((estado) => ({ ...estado, rodando: !estado.rodando, atualizadoEm: Date.now() }))}>{timer.rodando ? "Pausar" : "Retomar"}</button>
          <button type="button" onClick={() => setTimer((estado) => ({ ...estado, restanteSegundos: estado.restanteSegundos + 30, atualizadoEm: Date.now() }))}>+30s</button>
          <button type="button" onClick={() => void concluirAtual(false)}>Próx.</button>
        </div>
      </section>
      <ol className="ring-fila" aria-label="Fila de blocos da aula">
        {blocos.map((bloco, indice) => <li key={bloco.chave} className={indice === timer.indiceAtual ? "atual" : concluidas.has(bloco.chave) || indice < timer.indiceAtual ? "cumprido" : "pendente"}><span className="ring-fila-status" aria-hidden="true" /><span><strong>{bloco.nome}</strong><small>{bloco.tipo.toLocaleLowerCase("pt-BR")}</small></span><time>{Math.ceil(bloco.duracaoPrevistaSegundos / 60)} min</time></li>)}
      </ol>
      <footer className="ring-rodape"><strong>{totalPresentes}/{totalAlunos} presentes</strong><button type="button" onClick={onEncerrar}>Encerrar aula</button></footer>
    </div>
  );
}
