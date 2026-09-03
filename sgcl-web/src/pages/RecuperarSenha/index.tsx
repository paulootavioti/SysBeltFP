import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { Button } from "../../components/ui/Button";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { Input } from "../../components/ui/Input";
import { api } from "../../services/api";
import { getApiErrorMessage } from "../../shared/utils/getApiErrorMessage";
import "../Login/styles.css";

export function RecuperarSenha() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (token && senha !== confirmacao) {
      setErro("As senhas não coincidem.");
      return;
    }

    try {
      setCarregando(true);
      setErro("");
      const resposta = token
        ? await api.post("/auth/senha/redefinir", { token, senha })
        : await api.post("/auth/senha/solicitar", { email, origem: "EQUIPE" });
      setMensagem(resposta.data.message);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Não foi possível concluir a solicitação."));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-identity" aria-labelledby="recuperar-brand-title">
        <div className="login-brand">
          <strong id="recuperar-brand-title">SYS BELT</strong>
          <span>Sistema Faixa Preta</span>
        </div>
        <div className="login-brand-rule" aria-hidden="true" />
        <h1>Seu acesso continua protegido em cada etapa.</h1>
      </section>
      <section className="login-access">
        <div className="login-card">
          <header className="login-form-header">
            <span>Segurança da conta</span>
            <h2>{token ? "Criar nova senha" : "Recuperar acesso"}</h2>
          </header>
        <form className="login-form" onSubmit={enviar}>
          {token ? (
            <>
              <Input label="Nova senha" type="password" minLength={8} autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
              <Input label="Confirmar nova senha" type="password" minLength={8} autoComplete="new-password" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} required />
            </>
          ) : (
            <Input label="E-mail" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          )}
          <ErrorMessage message={erro} />
          {mensagem && <p className="login-sucesso" role="status">{mensagem}</p>}
          {!mensagem && <Button type="submit" disabled={carregando}>{carregando ? "Enviando..." : token ? "Redefinir senha" : "Enviar instruções"}</Button>}
          <Link className="login-link" to="/">Voltar ao login</Link>
        </form>
        </div>
      </section>
    </main>
  );
}
