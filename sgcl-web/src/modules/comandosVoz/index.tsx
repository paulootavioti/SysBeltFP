import { useEffect, useState } from "react";
import { LuMic, LuPencil, LuPlus, LuRadio } from "react-icons/lu";
import { Layout } from "../../components/layout/Layout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { getApiErrorMessage } from "../../shared/utils/getApiErrorMessage";
import { ComandosVozService, type AcaoVoz, type ComandoVoz, type DadosComando, type ArenaVoz } from "./ComandosVozService";
import "./styles.css";

const ACOES = [{ value: "INICIAR", label: "Iniciar" }, { value: "PAUSAR", label: "Pausar" }, { value: "AVANCAR", label: "Avançar" }, { value: "CONSULTAR", label: "Consultar" }, { value: "BLOCO_PAUSA", label: "Bloco de pausa" }];
const VAZIO: DadosComando = { gatilho: "", resposta: "", acao: "INICIAR", duracaoBlocoSegundos: null, avisoAntesFimSegundos: 10 };

export function ComandosVoz() {
  const [comandos, setComandos] = useState<ComandoVoz[]>([]);
  const [arenas, setArenas] = useState<ArenaVoz[]>([]);
  const [form, setForm] = useState<DadosComando>(VAZIO);
  const [editando, setEditando] = useState<ComandoVoz | null>(null);
  const [arenaId, setArenaId] = useState("");
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function carregar() { try { const dados = await ComandosVozService.listar(); setComandos(dados.comandos); setArenas(dados.arenas); if (!arenaId && dados.arenas[0]) setArenaId(String(dados.arenas[0].id)); } catch (e) { setErro(getApiErrorMessage(e, "Não foi possível carregar os comandos.")); } }
  useEffect(() => { void carregar(); }, []);

  function editar(comando: ComandoVoz) { setEditando(comando); setForm({ gatilho: comando.gatilho, resposta: comando.resposta, acao: comando.acao, duracaoBlocoSegundos: comando.duracaoBlocoSegundos, avisoAntesFimSegundos: comando.avisoAntesFimSegundos as 10 | 30 | null }); }
  async function salvar(e: React.FormEvent) { e.preventDefault(); setErro(""); try { if (editando) await ComandosVozService.atualizar(editando.id, form); else await ComandosVozService.criar(form); setForm(VAZIO); setEditando(null); setMensagem("Comando salvo."); await carregar(); } catch (error) { setErro(getApiErrorMessage(error, "Não foi possível salvar o comando.")); } }
  async function parear() { if (!arenaId) return; try { const r = await ComandosVozService.parear(Number(arenaId)); await navigator.clipboard.writeText(r.tokenPareamento); setMensagem("Arena pareada. Token copiado para a área de transferência."); await carregar(); } catch (e) { setErro(getApiErrorMessage(e, "Não foi possível parear a arena.")); } }
  async function testar(id: number) { if (!arenaId) return; try { const r = await ComandosVozService.testar(id, Number(arenaId)); setMensagem(`Teste enviado: ${r.resposta}`); } catch (e) { setErro(getApiErrorMessage(e, "Não foi possível testar na arena.")); } }

  return <Layout><div className="voz-page">
    <header className="voz-header"><LuMic size={30} /><div><h1>Comandos de voz</h1><p>Controle do cronômetro por dispositivo pareado à arena.</p></div></header>
    <ErrorMessage message={erro} />{mensagem && <p className="voz-sucesso" role="status">{mensagem}</p>}
    <section className="voz-pareamento"><Select label="Arena de teste" value={arenaId} onChange={(e) => setArenaId(e.target.value)} options={arenas.map((a) => ({ value: String(a.id), label: `${a.nome}${a.pareamentoVoz && !a.pareamentoVoz.revogadoEm ? " · pareada" : ""}` }))} /><Button variant="secondary" onClick={parear}><LuRadio /> Parear dispositivo</Button></section>
    <div className="voz-layout"><section className="voz-lista"><h2>Comandos cadastrados</h2><div className="voz-tabela-wrap"><table><thead><tr><th>Gatilho falado</th><th>Resposta da Alexa</th><th>Ação</th><th>Aviso</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>{comandos.map((c) => <tr key={c.id}><td><strong>{c.gatilho}</strong>{c.doSistema && <small>Do sistema</small>}</td><td>{c.resposta}</td><td>{ACOES.find((a) => a.value === c.acao)?.label}</td><td>{c.avisoAntesFimSegundos ? `${c.avisoAntesFimSegundos} s` : "Não avisar"}</td><td><button className="voz-icone" type="button" aria-label={`Editar ${c.gatilho}`} title="Editar comando" onClick={() => editar(c)}><LuPencil /></button><button className="voz-testar" type="button" onClick={() => testar(c.id)}>Testar</button></td></tr>)}</tbody></table></div></section>
    <form className="voz-form" onSubmit={salvar}><h2>{editando ? "Editar comando" : "Novo comando"}</h2><Input label="Gatilho falado" value={form.gatilho} disabled={Boolean(editando?.doSistema)} onChange={(e) => setForm({ ...form, gatilho: e.target.value })} /><Input label="Resposta falada da Alexa" value={form.resposta} onChange={(e) => setForm({ ...form, resposta: e.target.value })} /><Select label="Ação no timer" options={ACOES} value={form.acao} disabled={Boolean(editando?.doSistema)} onChange={(e) => setForm({ ...form, acao: e.target.value as AcaoVoz })} />{form.acao === "BLOCO_PAUSA" && <Input label="Duração do bloco (segundos)" type="number" min="1" value={form.duracaoBlocoSegundos ?? ""} onChange={(e) => setForm({ ...form, duracaoBlocoSegundos: Number(e.target.value) || null })} />}<fieldset><legend>Aviso antes do fim</legend>{[["", "Não avisar"], ["10", "10 s"], ["30", "30 s"]].map(([v, l]) => <label key={v}><input type="radio" name="aviso" value={v} checked={String(form.avisoAntesFimSegundos ?? "") === v} onChange={() => setForm({ ...form, avisoAntesFimSegundos: v ? Number(v) as 10 | 30 : null })} />{l}</label>)}</fieldset><div className="voz-form-acoes"><Button type="submit"><LuPlus /> Salvar comando</Button>{editando && <Button type="button" variant="secondary" onClick={() => { setEditando(null); setForm(VAZIO); }}>Cancelar</Button>}</div></form></div>
  </div></Layout>;
}
