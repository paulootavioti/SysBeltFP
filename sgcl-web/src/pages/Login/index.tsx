import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";

import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { ErrorMessage } from "../../components/ui/ErrorMessage";

import { getApiErrorMessage } from "../../shared/utils/getApiErrorMessage";

import "./styles.css";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setCarregando(true);
      setErro("");
      await login(email, senha);
      navigate("/dashboard");
    } catch (error) {
      setErro(getApiErrorMessage(error, "Usuário ou senha inválidos."));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <span className="login-brand-selo">SGCL</span>
          <h1>SGCL Kids</h1>
          <p>Gestão de academia e artes marciais</p>
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
