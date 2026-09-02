import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../../../contexts/useAuth";

import { Input } from "../../../../components/ui/Input";
import { Button } from "../../../../components/ui/Button";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";

import { getApiErrorMessage } from "../../../../utils/getApiErrorMessage";
import { lerSessaoExpirada, limparSessaoExpirada } from "../../../../utils/sessaoExpirada";

import "./styles.css";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [codigo, setCodigo] = useState("");
  const [desafio, setDesafio] = useState("");
  // O aviso é lido na montagem e limpo logo depois, para não reaparecer numa
  // próxima visita à tela de login dentro da mesma aba.
  const [erro, setErro] = useState(() => lerSessaoExpirada() ?? "");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    limparSessaoExpirada();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    try {
      setCarregando(true);
      setErro("");
      const resultado = await login(email, senha, desafio || undefined, codigo || undefined);
      if (resultado?.requerDoisFatores) {
        setDesafio(resultado.desafio);
        return;
      }
      navigate("/home");
    } catch (error) {
      setErro(getApiErrorMessage(error, "E-mail ou senha inválidos."));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-brand">
        <span className="login-brand-selo">SB</span>
        <h1>Portal do Professor</h1>
        <p>Sys Belt — Sistema Faixa Preta</p>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        {!desafio && <Input
          label="E-mail"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />}

        {!desafio && <Input
          label="Senha"
          type="password"
          placeholder="••••••••"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoComplete="current-password"
          required
        />}

        {!desafio && <Link className="login-link login-link-direita" to="/recuperar-senha">Esqueci minha senha</Link>}

        {desafio && <Input
          label="Código de verificação"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
          required
        />}

        {desafio && <button type="button" className="login-link" onClick={() => { setDesafio(""); setCodigo(""); }}>
          Usar outra conta
        </button>}

        <ErrorMessage message={erro} />

        <Button type="submit" disabled={carregando}>
          {carregando ? "Verificando..." : desafio ? "Verificar" : "Entrar"}
        </Button>

        <p className="login-mesmo-acesso">
          Use o mesmo login e senha do sistema completo (sgcl-web) — não é uma credencial nova.
        </p>
      </form>
    </div>
  );
}
