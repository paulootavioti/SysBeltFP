import { useEffect, useState } from "react";
import { LuBot, LuCheck, LuInstagram, LuLink, LuMessageCircle, LuPlug, LuRefreshCw, LuSave, LuTriangleAlert, LuX } from "react-icons/lu";
import { Button } from "../../../../components/ui/Button";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { Loading } from "../../../../components/ui/Loading";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import { AtendimentoService } from "../../services/AtendimentoService";
import { iniciarEmbeddedSignupWhatsApp } from "../../services/MetaEmbeddedSignup";
import { iniciarOAuthInstagram } from "../../services/MetaInstagramOAuth";
import type { CanalBot, FluxoBot, PassoFluxoBot, TemplateMensageria } from "../../types";

const ROTULOS_TIPO: Record<PassoFluxoBot["tipo"], string> = { TEXTO_LIVRE: "Texto livre", BOTOES: "Botões", CONDICIONAL: "Condicional", AUTOMATICO: "Automático" };
const REGRAS_TRANSFERENCIA = [
  "Pedido para falar com uma pessoa ou atendente",
  "Pergunta sobre preço, plano, mensalidade ou desconto",
  "Fluxo de qualificação concluído com consentimento",
  "Ausência de resposta após um único lembrete em 24 horas",
];
function dataCurta(valor: string | null) { return valor ? new Date(valor).toLocaleDateString("pt-BR") : "Não expira"; }

export function FluxoBots() {
  const [fluxo, setFluxo] = useState<FluxoBot | null>(null);
  const [canais, setCanais] = useState<CanalBot[]>([]);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [conectando, setConectando] = useState(false);
  const [tipoConexao, setTipoConexao] = useState<"WHATSAPP" | "INSTAGRAM">("WHATSAPP");
  const [identificador, setIdentificador] = useState("");
  const [codigo, setCodigo] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [templates, setTemplates] = useState<TemplateMensageria[]>([]);
  const [templateCanalId, setTemplateCanalId] = useState("");

  useEffect(() => {
    Promise.all([AtendimentoService.obterFluxoBot(), AtendimentoService.listarCanaisBot()])
      .then(async ([fluxoAtual, canaisAtuais]) => { setFluxo(fluxoAtual); setCanais(canaisAtuais); const whatsapp = canaisAtuais.find((canal) => canal.tipo === "WHATSAPP"); if (whatsapp) { setTemplateCanalId(String(whatsapp.id)); setTemplates(await AtendimentoService.listarTemplates(whatsapp.id, true)); } })
      .catch((e) => setErro(getApiErrorMessage(e, "Erro ao carregar a configuração dos bots.")));
  }, []);

  async function conectar() {
    try {
      setSalvando(true); setErro("");
      await AtendimentoService.conectarCanalMeta({ tipo: tipoConexao, identificadorExterno: identificador.trim(), codigo: codigo.trim(), businessAccountId: businessAccountId.trim() || undefined });
      setCanais(await AtendimentoService.listarCanaisBot());
      setConectando(false); setIdentificador(""); setCodigo(""); setBusinessAccountId("");
    } catch (e) { setErro(getApiErrorMessage(e, "Não foi possível conectar a conta Meta.")); }
    finally { setSalvando(false); }
  }

  async function conectarWhatsAppMeta() {
    try {
      setSalvando(true); setErro("");
      const dados = await iniciarEmbeddedSignupWhatsApp();
      await AtendimentoService.conectarCanalMeta({ tipo: "WHATSAPP", ...dados });
      setCanais(await AtendimentoService.listarCanaisBot()); setConectando(false);
    } catch (e) { setErro(getApiErrorMessage(e, "Não foi possível concluir a autorização da Meta.")); }
    finally { setSalvando(false); }
  }

  async function conectarInstagramMeta() {
    try {
      setSalvando(true); setErro("");
      const dados = await iniciarOAuthInstagram();
      await AtendimentoService.conectarCanalMeta({ tipo: "INSTAGRAM", identificadorExterno: "", codigo: dados.codigo });
      setCanais(await AtendimentoService.listarCanaisBot()); setConectando(false);
    } catch (e) { setErro(getApiErrorMessage(e, "Não foi possível concluir a autorização do Instagram.")); }
    finally { setSalvando(false); }
  }

  async function desativar(canal: CanalBot) {
    try { setErro(""); await AtendimentoService.desativarCanalMeta(canal.id); setCanais(await AtendimentoService.listarCanaisBot()); }
    catch (e) { setErro(getApiErrorMessage(e, "Não foi possível desativar o canal.")); }
  }

  async function diagnosticar(canal: CanalBot) {
    try { setSalvando(true); setErro(""); await AtendimentoService.diagnosticarCanalMeta(canal.id); setCanais(await AtendimentoService.listarCanaisBot()); }
    catch (e) { setErro(getApiErrorMessage(e, "A conexão precisa ser refeita.")); setCanais(await AtendimentoService.listarCanaisBot()); }
    finally { setSalvando(false); }
  }

  function alterarTexto(indice: number, texto: string) {
    if (!fluxo) return;
    setSalvo(false);
    setFluxo({ ...fluxo, passos: fluxo.passos.map((passo, i) => i === indice ? { ...passo, texto } : passo) });
  }

  async function publicar() {
    if (!fluxo) return;
    try {
      setSalvando(true); setErro(""); setSalvo(false);
      setFluxo(await AtendimentoService.publicarFluxoBot(fluxo.nome, fluxo.passos));
      setSalvo(true);
    } catch (e) { setErro(getApiErrorMessage(e, "Não foi possível publicar o fluxo.")); }
    finally { setSalvando(false); }
  }

  async function sincronizarTemplates() {
    try {
      setSalvando(true); setErro("");
      await AtendimentoService.sincronizarTemplates(Number(templateCanalId));
      setTemplates(await AtendimentoService.listarTemplates(Number(templateCanalId), true));
    } catch (e) { setErro(getApiErrorMessage(e, "Não foi possível sincronizar os templates.")); }
    finally { setSalvando(false); }
  }

  if (!fluxo && !erro) return <Loading />;
  return <div className="fluxo-bots">
    <ErrorMessage message={erro} />
    {fluxo && <>
      <section className="fluxo-canais" aria-label="Conexões dos bots">
        {canais.map((canal) => <article className="fluxo-canal" key={canal.id}>
          <span className={`fluxo-canal-icone ${canal.tipo.toLowerCase()}`}>{canal.tipo === "WHATSAPP" ? <LuMessageCircle /> : <LuInstagram />}</span>
          <div><strong>{canal.nomeExibicao}</strong><span>{canal.conta}</span></div>
          <span className={`fluxo-status ${canal.status.toLowerCase()}`}>{canal.status === "CONECTADO" ? <LuCheck /> : canal.status === "ERRO" ? <LuTriangleAlert /> : <LuRefreshCw />} {canal.status === "CONECTADO" ? "Conectado" : canal.status === "ERRO" ? "Erro" : canal.status === "VALIDANDO" ? "Validando" : "Inativo"}</span>
          <div className="fluxo-canal-metrica"><strong>{canal.leadsUltimos30Dias}</strong><span>leads em 30 dias</span></div>
          <div className="fluxo-canal-saude"><span>Validade <strong>{dataCurta(canal.tokenExpiraEm)}</strong></span><span>Diagnóstico <strong>{dataCurta(canal.ultimoDiagnosticoEm)}</strong></span><span>Credencial <strong>v{canal.tokenVersao}</strong></span></div>
          <div className="fluxo-canal-comandos"><button type="button" disabled={salvando} onClick={() => void diagnosticar(canal)}><LuRefreshCw /> Diagnosticar</button><button type="button" onClick={() => void (canal.status === "CONECTADO" ? desativar(canal) : (setTipoConexao(canal.tipo), setConectando(true)))}>{canal.status === "CONECTADO" ? "Desativar" : "Reconectar"}</button></div>
        </article>)}
        {canais.length === 0 && <div className="fluxo-sem-canal"><LuTriangleAlert /><span>Nenhum canal de mensageria configurado nesta unidade.</span></div>}
        <button className="fluxo-conectar" type="button" onClick={() => setConectando(true)}><LuPlug /> Conectar conta Meta</button>
      </section>

      {canais.some((canal) => canal.tipo === "WHATSAPP") && <section className="fluxo-templates"><header><div><span><LuMessageCircle /> WhatsApp</span><h2>Templates da Meta</h2></div><Button variant="secondary" disabled={salvando || !templateCanalId} onClick={() => void sincronizarTemplates()}><LuRefreshCw /> Sincronizar</Button></header><div className="fluxo-template-seletor"><label>Canal<select value={templateCanalId} onChange={async (e) => { setTemplateCanalId(e.target.value); setTemplates(await AtendimentoService.listarTemplates(Number(e.target.value), true)); }}>{canais.filter((canal) => canal.tipo === "WHATSAPP").map((canal) => <option key={canal.id} value={canal.id}>{canal.nomeExibicao}</option>)}</select></label></div><div className="fluxo-template-lista">{templates.map((template) => <div key={template.id}><strong>{template.nome}</strong><span>{template.idioma}</span><span className={`template-status ${template.status.toLowerCase()}`}>{template.status}</span><p>{template.textoExibicao}</p>{template.quantidadeParametros > 0 && <small>{template.quantidadeParametros} parâmetro(s)</small>}{!template.suportado && <small>Formato ainda não suportado para envio</small>}</div>)}{templates.length === 0 && <p>Nenhum template sincronizado para este canal.</p>}</div></section>}

      <header className="fluxo-editor-topo"><div><span><LuBot /> Fluxo ativo</span><h2>{fluxo.nome}</h2><small>Versão {fluxo.versao}</small></div><Button variant="marca" onClick={() => void publicar()} disabled={salvando}><LuSave /> {salvando ? "Publicando..." : "Publicar nova versão"}</Button></header>
      <div className="fluxo-conteudo">
        <section className="fluxo-passos" aria-label="Sequência de perguntas">
          {fluxo.passos.map((passo, indice) => <article className="fluxo-passo" key={passo.id}>
            <span className="fluxo-numero">{indice + 1}</span>
            <div className="fluxo-passo-corpo"><header><strong>{passo.id.replaceAll("_", " ")}</strong><span>{ROTULOS_TIPO[passo.tipo]}</span>{passo.campo && <code>{passo.campo}</code>}</header>
              <textarea aria-label={`Texto do passo ${indice + 1}`} maxLength={800} value={passo.texto} onChange={(e) => alterarTexto(indice, e.target.value)} />
              {!!passo.opcoes?.length && <div className="fluxo-opcoes">{passo.opcoes.map((opcao) => <span key={opcao}>{opcao}</span>)}</div>}
              {passo.regra && <p className="fluxo-regra">{passo.regra}</p>}
            </div>
          </article>)}
        </section>
        <aside className="fluxo-transferencia"><h3>Regras de transferência</h3>{REGRAS_TRANSFERENCIA.map((regra) => <div key={regra}><LuCheck /><span>{regra}</span></div>)}</aside>
      </div>
      {salvo && <div className="fluxo-sucesso" role="status"><LuCheck /> Nova versão publicada.</div>}
      {conectando && <div className="fluxo-modal-fundo" role="presentation"><section className="fluxo-modal" role="dialog" aria-modal="true" aria-labelledby="titulo-conectar-meta"><header><div><LuLink /><h2 id="titulo-conectar-meta">Conectar conta Meta</h2></div><button type="button" onClick={() => setConectando(false)} aria-label="Fechar"><LuX /></button></header>
        <div className="fluxo-segmentado"><button type="button" className={tipoConexao === "WHATSAPP" ? "ativo" : ""} onClick={() => setTipoConexao("WHATSAPP")}><LuMessageCircle /> WhatsApp</button><button type="button" className={tipoConexao === "INSTAGRAM" ? "ativo" : ""} onClick={() => setTipoConexao("INSTAGRAM")}><LuInstagram /> Instagram</button></div>
        {tipoConexao === "WHATSAPP" ? <button className="fluxo-meta-oficial" type="button" disabled={salvando} onClick={() => void conectarWhatsAppMeta()}><LuMessageCircle /> Continuar com Meta</button> : <button className="fluxo-meta-oficial instagram" type="button" disabled={salvando} onClick={() => void conectarInstagramMeta()}><LuInstagram /> Continuar com Instagram</button>}
        <div className="fluxo-divisor"><span>configuração técnica</span></div>
        <label>Identificador da conta Meta<input value={identificador} onChange={(e) => setIdentificador(e.target.value)} maxLength={200} autoComplete="off" /></label>
        {tipoConexao === "WHATSAPP" && <label>ID da conta empresarial (WABA)<input value={businessAccountId} onChange={(e) => setBusinessAccountId(e.target.value)} maxLength={200} autoComplete="off" /></label>}
        <label>Código de autorização<input value={codigo} onChange={(e) => setCodigo(e.target.value)} maxLength={2000} autoComplete="off" type="password" /></label>
        <footer><Button variant="secondary" onClick={() => setConectando(false)}>Cancelar</Button><Button variant="marca" disabled={salvando || !codigo.trim() || (tipoConexao === "WHATSAPP" && (!identificador.trim() || !businessAccountId.trim()))} onClick={() => void conectar()}><LuPlug /> {salvando ? "Validando..." : "Validar e conectar"}</Button></footer>
      </section></div>}
    </>}
  </div>;
}
