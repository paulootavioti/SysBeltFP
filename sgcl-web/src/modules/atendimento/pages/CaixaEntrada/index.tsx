import { useEffect, useMemo, useRef, useState } from "react";
import { LuBot, LuCalendarPlus, LuCheck, LuCheckCheck, LuCircleUserRound, LuClock3, LuFileText, LuFilter, LuGraduationCap, LuInbox, LuInstagram, LuMessageCircle, LuPaperclip, LuRefreshCw, LuSearch, LuSend, LuTrendingUp, LuTriangleAlert, LuUserCheck, LuX } from "react-icons/lu";
import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Button } from "../../../../components/ui/Button";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { Loading } from "../../../../components/ui/Loading";
import { Situacao } from "../../../../components/ui/Situacao";
import { useAuth } from "../../../../contexts/useAuth";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import { resolverUrlUpload } from "../../../../shared/utils/resolverUrlUpload";
import { AtendimentoService } from "../../services/AtendimentoService";
import type { CanalMensageria, ConversaDetalhe, ConversaResumo, MensagemAtendimento, TemplateMensageria } from "../../types";
import { FluxoBots } from "./FluxoBots";
import "./styles.css";

const RESPOSTAS_RAPIDAS = ["Olá! Como posso ajudar?", "Vou verificar e já retorno.", "Podemos agendar uma aula experimental?"];
const ESTAGIOS: Record<string, string> = { NOVO: "Novo", CONTATADO: "Contatado", QUALIFICADO: "Qualificado", EXPERIMENTAL_AGENDADA: "Experimental agendada", COMPARECEU: "Compareceu", NEGOCIACAO: "Negociação", MATRICULADO: "Matriculado", PERDIDO: "Perdido" };
const PROXIMO_ESTAGIO: Record<string, string | undefined> = { NOVO: "CONTATADO", CONTATADO: "QUALIFICADO", EXPERIMENTAL_AGENDADA: "COMPARECEU", COMPARECEU: "NEGOCIACAO" };

function horario(valor: string | null) {
  if (!valor) return "";
  const data = new Date(valor); const hoje = new Date();
  return data.toDateString() === hoje.toDateString() ? data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}
function iniciais(nome: string | null) { return (nome || "Contato").split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase(); }
function IconeCanal({ tipo }: { tipo: CanalMensageria }) { return tipo === "WHATSAPP" ? <LuMessageCircle /> : <LuInstagram />; }
function statusMensagem(mensagem: MensagemAtendimento) {
  if (mensagem.statusEntrega === "FALHOU") return <Situacao degrau="acao" className="atendimento-status" ><LuX /> Falha no envio</Situacao>;
  if (mensagem.statusEntrega === "LIDA") return <Situacao degrau="neutro" className="atendimento-status"><LuCheckCheck /> Lida</Situacao>;
  if (mensagem.statusEntrega === "PENDENTE") return <Situacao degrau="atencao" className="atendimento-status"><LuClock3 /> Envio pendente</Situacao>;
  return <Situacao degrau="neutro" className="atendimento-status"><LuCheck /> {mensagem.statusEntrega === "RECEBIDA" ? "Recebida" : "Enviada"}</Situacao>;
}
function MidiaMensagem({ mensagem }: { mensagem: MensagemAtendimento }) {
  if (!mensagem.mediaStatus) return null;
  if (mensagem.mediaStatus === "PENDENTE" || mensagem.mediaStatus === "PROCESSANDO") return <div className="atendimento-midia-estado"><LuClock3 /> Processando anexo</div>;
  if (mensagem.mediaStatus === "FALHOU" || !mensagem.arquivoUrl) return <div className="atendimento-midia-estado falhou"><LuTriangleAlert /> Anexo indisponível</div>;
  const url = resolverUrlUpload(mensagem.arquivoUrl);
  if (mensagem.tipoConteudo === "IMAGEM") return <a href={url} target="_blank" rel="noreferrer" className="atendimento-midia"><img src={url} alt={mensagem.arquivoNome || "Imagem recebida"} loading="lazy" /></a>;
  if (mensagem.tipoConteudo === "AUDIO") return <audio className="atendimento-audio" controls preload="metadata" src={url} />;
  if (mensagem.tipoConteudo === "VIDEO") return <video className="atendimento-video" controls preload="metadata" src={url} />;
  return <a href={url} target="_blank" rel="noreferrer" className="atendimento-documento"><LuFileText /><span>{mensagem.arquivoNome || "Abrir documento"}</span></a>;
}

export function CaixaEntrada() {
  const { usuario } = useAuth();
  const somenteLeitura = usuario?.perfil === "PROFESSOR";
  const podeConfigurarBot = usuario?.perfil === "DONO" || usuario?.perfil === "ADMIN";
  const [aba, setAba] = useState<"caixa" | "fluxo">("caixa");
  const [conversas, setConversas] = useState<ConversaResumo[]>([]);
  const [selecionada, setSelecionada] = useState<ConversaDetalhe | null>(null);
  const [busca, setBusca] = useState(""); const [canal, setCanal] = useState<CanalMensageria | "">("");
  const [somenteNaoLidas, setSomenteNaoLidas] = useState(false); const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(true); const [enviando, setEnviando] = useState(false); const [erro, setErro] = useState("");
  const [dataNascimento, setDataNascimento] = useState(""); const [dataExperimental, setDataExperimental] = useState(""); const [executandoAcao, setExecutandoAcao] = useState(false);
  const [templates, setTemplates] = useState<TemplateMensageria[]>([]); const [templateId, setTemplateId] = useState("");
  const [parametrosTemplate, setParametrosTemplate] = useState<string[]>([]);
  const [anexo, setAnexo] = useState<File | null>(null); const arquivoRef = useRef<HTMLInputElement>(null);
  const fimRef = useRef<HTMLDivElement>(null);

  async function carregarConversas(manterId?: number) {
    try {
      setErro(""); const pagina = await AtendimentoService.listar({ busca: busca.trim() || undefined, canal: canal || undefined, naoLidas: somenteNaoLidas });
      setConversas(pagina.itens);
      const id = manterId ?? selecionada?.id ?? pagina.itens[0]?.id;
      if (id && pagina.itens.some((item) => item.id === id)) setSelecionada(await AtendimentoService.obter(id));
      else if (pagina.itens[0]) setSelecionada(await AtendimentoService.obter(pagina.itens[0].id)); else setSelecionada(null);
    } catch (e) { setErro(getApiErrorMessage(e, "Erro ao carregar atendimentos.")); }
    finally { setCarregando(false); }
  }
  useEffect(() => { const t = window.setTimeout(() => { setCarregando(true); void carregarConversas(); }, 250); return () => window.clearTimeout(t); }, [busca, canal, somenteNaoLidas]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { fimRef.current?.scrollIntoView({ block: "end" }); }, [selecionada?.mensagens.length]);
  useEffect(() => {
    const canalId = selecionada?.canalMensageria.id;
    if (!canalId || selecionada.canalMensageria.tipo !== "WHATSAPP") { setTemplates([]); setTemplateId(""); setParametrosTemplate([]); return; }
    void AtendimentoService.listarTemplates(canalId).then(setTemplates).catch(() => setTemplates([]));
  }, [selecionada?.canalMensageria.id, selecionada?.canalMensageria.tipo]);

  async function abrir(id: number) { try { setSelecionada(await AtendimentoService.obter(id)); setConversas((lista) => lista.map((c) => c.id === id ? { ...c, naoLidas: 0 } : c)); } catch (e) { setErro(getApiErrorMessage(e)); } }
  async function responder() {
    const usarTemplate = selecionada?.canalMensageria.tipo === "WHATSAPP" && !selecionada.janelaAtendimentoAberta;
    if (!selecionada || (usarTemplate ? !templateId : !mensagem.trim() && !anexo)) return;
    try { setEnviando(true); if (anexo && !usarTemplate) await AtendimentoService.enviarAnexo(selecionada.id, anexo, mensagem); else await AtendimentoService.responder(selecionada.id, mensagem.trim(), usarTemplate ? Number(templateId) : undefined, parametrosTemplate); setMensagem(""); setAnexo(null); setTemplateId(""); setParametrosTemplate([]); await carregarConversas(selecionada.id); }
    catch (e) { setErro(getApiErrorMessage(e, "Não foi possível enviar a mensagem.")); } finally { setEnviando(false); }
  }
  async function assumir() { if (!selecionada) return; await AtendimentoService.assumir(selecionada.id); await carregarConversas(selecionada.id); }
  async function encerrar() { if (!selecionada) return; await AtendimentoService.encerrar(selecionada.id); await carregarConversas(selecionada.id); }
  async function reenviar(id: number) { try { setErro(""); await AtendimentoService.reenviarMensagem(id); await carregarConversas(selecionada?.id); } catch (e) { setErro(getApiErrorMessage(e, "Não foi possível reenviar a mensagem.")); } }
  async function executarAcao(acao: () => Promise<unknown>) {
    if (!selecionada) return;
    try { setExecutandoAcao(true); setErro(""); await acao(); await carregarConversas(selecionada.id); }
    catch (e) { setErro(getApiErrorMessage(e, "Não foi possível concluir a ação.")); } finally { setExecutandoAcao(false); }
  }
  const totalNaoLidas = useMemo(() => conversas.reduce((total, c) => total + c.naoLidas, 0), [conversas]);

  return <Layout>
    <PageHeader title="Atendimento" subtitle={`${conversas.length} conversas · ${totalNaoLidas} não lidas`} />
    <ErrorMessage message={erro} />
    <div className="atendimento-tabs"><button className={aba === "caixa" ? "ativo" : ""} type="button" onClick={() => setAba("caixa")}><LuInbox /> Caixa de entrada</button>{podeConfigurarBot && <button className={aba === "fluxo" ? "ativo" : ""} type="button" onClick={() => setAba("fluxo")}><LuBot /> Fluxo dos bots</button>}</div>
    {aba === "fluxo" ? <FluxoBots /> : carregando ? <Loading /> : <div className="atendimento-shell">
      <aside className="atendimento-lista" aria-label="Conversas">
        <div className="atendimento-busca"><LuSearch /><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar contato" aria-label="Buscar contato" /></div>
        <div className="atendimento-filtros">
          <button type="button" className={!canal ? "ativo" : ""} onClick={() => setCanal("")}>Todos</button>
          <button type="button" className={canal === "WHATSAPP" ? "ativo" : ""} onClick={() => setCanal("WHATSAPP")}><LuMessageCircle /> WhatsApp</button>
          <button type="button" className={canal === "INSTAGRAM" ? "ativo" : ""} onClick={() => setCanal("INSTAGRAM")}><LuInstagram /> Instagram</button>
          <button type="button" className={somenteNaoLidas ? "ativo filtro-icon" : "filtro-icon"} onClick={() => setSomenteNaoLidas((v) => !v)} title="Somente não lidas" aria-label="Somente não lidas"><LuFilter /></button>
        </div>
        <div className="atendimento-itens">{conversas.map((conversa) => <button type="button" key={conversa.id} className={`atendimento-item${selecionada?.id === conversa.id ? " ativo" : ""}`} onClick={() => void abrir(conversa.id)}>
          <span className={`atendimento-avatar ${conversa.canalMensageria.tipo.toLowerCase()}`}>{iniciais(conversa.contatoNome)}</span>
          <span className="atendimento-item-corpo"><span className="atendimento-item-topo"><strong>{conversa.contatoNome || "Contato"}</strong><time>{horario(conversa.ultimaMensagemEm)}</time></span>
            <span className="atendimento-previa">{conversa.mensagens[0]?.conteudo || "Mensagem sem texto"}</span>
            <span className="atendimento-chips"><span><IconeCanal tipo={conversa.canalMensageria.tipo} /> {conversa.canalMensageria.tipo === "WHATSAPP" ? "WhatsApp" : "Instagram"}</span>{conversa.lead && <span>{ESTAGIOS[conversa.lead.estagio] || conversa.lead.estagio}</span>}</span>
          </span>{conversa.naoLidas > 0 && <span className="atendimento-nao-lida" title={`${conversa.naoLidas} não lidas`}>{conversa.naoLidas}</span>}
        </button>)}</div>
      </aside>

      <section className="atendimento-thread">
        {!selecionada ? <div className="atendimento-vazio"><LuMessageCircle /><strong>Nenhuma conversa encontrada</strong></div> : <>
          <header className="atendimento-thread-header"><div><strong>{selecionada.contatoNome || "Contato"}</strong><span><IconeCanal tipo={selecionada.canalMensageria.tipo} /> {selecionada.canalMensageria.nomeExibicao}</span></div>
            {!somenteLeitura && <div className="atendimento-acoes">{!selecionada.atendente && <Button size="sm" variant="secondary" onClick={() => void assumir()}><LuUserCheck /> Assumir</Button>}<Button size="sm" variant="secondary" onClick={() => void encerrar()} disabled={selecionada.estado === "ENCERRADA"}><LuX /> Encerrar</Button></div>}
          </header>
          <div className="atendimento-mensagens">
            <div className="atendimento-importacao">Cópia da conversa importada do bot · {selecionada.mensagens.length} mensagens</div>
            {selecionada.mensagens.map((item) => item.autor === "SISTEMA" ? <div key={item.id} className="atendimento-sistema">{item.conteudo}</div> : <article key={item.id} className={`atendimento-balao ${item.autor.toLowerCase()}`}>
              <span className="atendimento-autor">{item.autor === "BOT" ? "Assistente automático" : item.autor === "ATENDENTE" ? `${item.usuario?.nome || "Equipe"} · Atendimento` : selecionada.contatoNome || "Contato"}</span>
              <MidiaMensagem mensagem={item} />{item.conteudo && <p>{item.conteudo}</p>}{!item.conteudo && !item.mediaStatus && <p>[{item.tipoConteudo.toLowerCase()}]</p>}<footer><time>{horario(item.enviadaEm)}</time>{item.direcao === "SAIDA" && statusMensagem(item)}{!somenteLeitura && item.statusEntrega === "FALHOU" && <button type="button" className="atendimento-reenviar" onClick={() => void reenviar(item.id)} title="Tentar enviar novamente"><LuRefreshCw /> Reenviar</button>}</footer>
            </article>)}<div ref={fimRef} />
          </div>
          {!somenteLeitura && <footer className="atendimento-composer">{selecionada.canalMensageria.tipo === "WHATSAPP" && !selecionada.janelaAtendimentoAberta ? <div className="atendimento-janela"><LuClock3 /><div><strong>Janela de atendimento encerrada</strong><span>Selecione um template aprovado pela Meta para retomar o contato.</span></div></div> : <div className="atendimento-respostas-rapidas">{RESPOSTAS_RAPIDAS.map((r) => <button type="button" key={r} onClick={() => setMensagem(r)}>{r}</button>)}</div>}
            {anexo && <div className="atendimento-anexo-selecionado"><LuPaperclip /><span>{anexo.name}</span><small>{(anexo.size / 1024 / 1024).toFixed(1)} MB</small><button type="button" onClick={() => setAnexo(null)} aria-label="Remover anexo"><LuX /></button></div>}
            <div className="atendimento-envio">{selecionada.canalMensageria.tipo === "WHATSAPP" && !selecionada.janelaAtendimentoAberta ? <select value={templateId} onChange={(e) => { setTemplateId(e.target.value); const template = templates.find((item) => item.id === Number(e.target.value)); setParametrosTemplate(Array.from({ length: template?.quantidadeParametros || 0 }, () => "")); }} aria-label="Template aprovado"><option value="">Selecione um template aprovado</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.nome} · {template.idioma}</option>)}</select> : <><input ref={arquivoRef} className="atendimento-arquivo-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif,audio/*,video/mp4,video/3gpp,application/pdf,text/plain,.doc,.docx" onChange={(e) => { const arquivo = e.target.files?.[0] || null; setAnexo(arquivo); if (arquivo && selecionada.canalMensageria.tipo === "INSTAGRAM") setMensagem(""); }} /><button className="atendimento-anexar" type="button" onClick={() => arquivoRef.current?.click()} title="Anexar arquivo" aria-label="Anexar arquivo"><LuPaperclip /></button><textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} placeholder={anexo ? "Adicionar legenda" : "Escreva uma resposta"} maxLength={anexo ? 1024 : 4000} disabled={!!anexo && selecionada.canalMensageria.tipo === "INSTAGRAM"} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void responder(); } }} /></>}<button type="button" onClick={() => void responder()} disabled={enviando || (selecionada.canalMensageria.tipo === "WHATSAPP" && !selecionada.janelaAtendimentoAberta ? !templateId || parametrosTemplate.some((item) => !item.trim()) : !mensagem.trim() && !anexo)} title="Enviar mensagem" aria-label="Enviar mensagem"><LuSend /></button></div>
            {parametrosTemplate.length > 0 && <div className="atendimento-parametros-template">{parametrosTemplate.map((valor, indice) => <label key={indice}>Parâmetro {indice + 1}<input value={valor} maxLength={1000} onChange={(e) => setParametrosTemplate((atuais) => atuais.map((item, i) => i === indice ? e.target.value : item))} /></label>)}</div>}
            <small>A resposta sai pelo {selecionada.canalMensageria.tipo === "WHATSAPP" ? "WhatsApp" : "Instagram"} da academia e fica registrada na timeline do lead.</small>
          </footer>}
        </>}
      </section>

      <aside className="atendimento-lead">
        {!selecionada ? null : selecionada.lead ? <><div className="atendimento-lead-topo"><span className="atendimento-avatar neutro">{iniciais(selecionada.lead.nome)}</span><div><strong>{selecionada.lead.nome}</strong><span>Lead #{selecionada.lead.id}</span></div></div>
          <span className="atendimento-estagio">{ESTAGIOS[selecionada.lead.estagio] || selecionada.lead.estagio}</span>
          {selecionada.lead.slaEstourado && <div className="atendimento-alerta perigo"><LuClock3 /> SLA de primeiro contato vencido</div>}
          {selecionada.lead.situacao === "EX_ALUNO" && <div className="atendimento-alerta">Ex-aluno identificado. A reativação preservará faixa e histórico.</div>}
          <dl><div><dt>Para quem</dt><dd>{selecionada.lead.tipoContato === "RESPONSAVEL" ? selecionada.lead.praticanteNome || "Dependente" : "Próprio contato"}</dd></div><div><dt>Situação</dt><dd>{selecionada.lead.situacao.replaceAll("_", " ")}</dd></div><div><dt>Turno</dt><dd>{selecionada.lead.turnoPreferido.join(", ") || "Não informado"}</dd></div><div><dt>Canal</dt><dd>{selecionada.lead.canal.nome}</dd></div></dl>
          <section className="atendimento-consentimento"><h3><LuCheck /> Consentimento</h3>{selecionada.lead.consentimentos[0] ? <><p>{selecionada.lead.consentimentos[0].textoAceito}</p><small>Versão {selecionada.lead.consentimentos[0].versao} · {new Date(selecionada.lead.consentimentos[0].aceitoEm).toLocaleString("pt-BR")}</small></> : <p>Não registrado.</p>}</section>
          {!somenteLeitura && selecionada.lead.estagio !== "MATRICULADO" && <section className="atendimento-acoes-lead">
            {PROXIMO_ESTAGIO[selecionada.lead.estagio] && <Button size="sm" variant="secondary" disabled={executandoAcao} onClick={() => void executarAcao(() => AtendimentoService.atualizarEstagio(selecionada.lead!.id, PROXIMO_ESTAGIO[selecionada.lead!.estagio]!))}><LuTrendingUp /> Avançar para {ESTAGIOS[PROXIMO_ESTAGIO[selecionada.lead.estagio]!]}</Button>}
            {!["EXPERIMENTAL_AGENDADA", "MATRICULADO", "PERDIDO"].includes(selecionada.lead.estagio) && <div className="atendimento-acao-campo"><label htmlFor="data-experimental">Aula experimental</label><input id="data-experimental" type="datetime-local" value={dataExperimental} onChange={(e) => setDataExperimental(e.target.value)} /><Button size="sm" variant="secondary" disabled={executandoAcao || !dataExperimental} onClick={() => void executarAcao(() => AtendimentoService.agendarExperimental(selecionada.lead!.id, new Date(dataExperimental).toISOString()))}><LuCalendarPlus /> Agendar</Button></div>}
            {!selecionada.lead.alunoId && <div className="atendimento-acao-campo"><label htmlFor="nascimento-conversao">Nascimento do aluno</label><input id="nascimento-conversao" type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} /></div>}
            <Button size="sm" variant="marca" disabled={executandoAcao || (!selecionada.lead.alunoId && !dataNascimento)} onClick={() => void executarAcao(() => AtendimentoService.converterLead(selecionada.lead!.id, dataNascimento))}><LuGraduationCap /> {selecionada.lead.situacao === "EX_ALUNO" && selecionada.lead.alunoId ? "Reativar aluno" : "Converter em aluno"}</Button>
          </section>}
          <section className="atendimento-timeline"><h3>Timeline</h3>{selecionada.lead.eventos.map((evento) => <div key={evento.id}><span></span><p><strong>{evento.descricao}</strong><small>{new Date(evento.criadoEm).toLocaleString("pt-BR")}{evento.usuario ? ` · ${evento.usuario.nome}` : ""}</small></p></div>)}</section>
        </> : <div className="atendimento-vazio lateral"><LuCircleUserRound /><strong>Lead ainda não criado</strong><span>A conversa permanece disponível para a equipe.</span></div>}
      </aside>
    </div>}
  </Layout>;
}
