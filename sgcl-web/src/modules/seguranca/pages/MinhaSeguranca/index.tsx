import { useEffect, useState } from "react";
import { LuCheck, LuClipboard, LuKeyRound, LuShieldCheck, LuShieldOff } from "react-icons/lu";
import { Layout } from "../../../../components/layout/Layout";
import { Button } from "../../../../components/ui/Button";
import { Input } from "../../../../components/ui/Input";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import { SegurancaService, type EstadoSeguranca } from "../../services/SegurancaService";
import "./styles.css";

export function MinhaSeguranca() {
  const [estado, setEstado] = useState<EstadoSeguranca | null>(null);
  const [configuracao, setConfiguracao] = useState<{ segredo: string; uri: string } | null>(null);
  const [codigo, setCodigo] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    SegurancaService.obter().then(setEstado).catch((e) => setErro(getApiErrorMessage(e, "Não foi possível carregar a segurança da conta.")));
  }, []);

  async function iniciar() {
    try {
      setOcupado(true); setErro(""); setMensagem("");
      setConfiguracao(await SegurancaService.iniciar());
    } catch (e) { setErro(getApiErrorMessage(e, "Não foi possível iniciar a configuração.")); }
    finally { setOcupado(false); }
  }

  async function confirmar() {
    try {
      setOcupado(true); setErro("");
      await SegurancaService.confirmar(codigo);
      setEstado(await SegurancaService.obter());
      setConfiguracao(null); setCodigo(""); setMensagem("Verificação em duas etapas ativada.");
    } catch (e) { setErro(getApiErrorMessage(e, "Código inválido.")); }
    finally { setOcupado(false); }
  }

  async function desativar() {
    try {
      setOcupado(true); setErro("");
      await SegurancaService.desativar(senha, codigo);
      setEstado(await SegurancaService.obter());
      setSenha(""); setCodigo(""); setMensagem("Verificação em duas etapas desativada.");
    } catch (e) { setErro(getApiErrorMessage(e, "Não foi possível desativar a proteção.")); }
    finally { setOcupado(false); }
  }

  return <Layout><section className="seguranca-conta">
    <header className="seguranca-cabecalho">
      <LuShieldCheck size={30} aria-hidden="true" />
      <div><h1>Segurança da conta</h1><p>Proteja seu acesso com um aplicativo autenticador.</p></div>
    </header>

    <div className="seguranca-painel">
      <div className="seguranca-status">
        {estado?.doisFatoresAtivo ? <LuShieldCheck size={24} /> : <LuShieldOff size={24} />}
        <div><strong>Verificação em duas etapas</strong><span>{estado?.doisFatoresAtivo ? "Ativa" : "Inativa"}</span></div>
      </div>

      {!estado?.doisFatoresAtivo && !configuracao && <Button onClick={iniciar} disabled={!estado || ocupado}>
        <LuKeyRound size={17} /> Ativar proteção
      </Button>}

      {configuracao && <div className="seguranca-configuracao">
        <h2>Adicionar ao autenticador</h2>
        <p>Cadastre a chave abaixo no Google Authenticator, Microsoft Authenticator, 1Password ou aplicativo compatível.</p>
        <div className="seguranca-chave"><code>{configuracao.segredo}</code><button type="button" title="Copiar chave" aria-label="Copiar chave" onClick={() => navigator.clipboard.writeText(configuracao.segredo)}><LuClipboard /></button></div>
        <a href={configuracao.uri}>Abrir no aplicativo autenticador</a>
        <div className="seguranca-formulario"><Input label="Código de 6 dígitos" inputMode="numeric" autoComplete="one-time-code" value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))} /><Button onClick={confirmar} disabled={ocupado || codigo.length !== 6}><LuCheck /> Confirmar ativação</Button></div>
      </div>}

      {estado?.doisFatoresAtivo && <div className="seguranca-configuracao">
        <h2>Desativar proteção</h2><p>Confirme sua senha e o código atual do autenticador.</p>
        <div className="seguranca-formulario"><Input label="Senha atual" type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} /><Input label="Código de 6 dígitos" inputMode="numeric" autoComplete="one-time-code" value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))} /><Button variant="danger" onClick={desativar} disabled={ocupado || !senha || codigo.length !== 6}>Desativar</Button></div>
      </div>}

      <ErrorMessage message={erro} />
      {mensagem && <p className="seguranca-sucesso" role="status">{mensagem}</p>}
    </div>
  </section></Layout>;
}
