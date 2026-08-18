import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

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
      await login(email, senha);
      navigate("/portal");
    } catch (error) {
      setErro(getApiErrorMessage(error, "E-mail ou senha inválidos."));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <span className="login-brand-selo">SB</span>
          <h1>Portal da Família</h1>
          <p>Sys Belt — Sistema Faixa Preta</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <Input
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="current-password"
            required
          />

          <ErrorMessage message={erro} />

          <Button type="submit" disabled={carregando}>
            {carregando ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
