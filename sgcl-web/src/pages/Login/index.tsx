import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../contexts/useAuth";

import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { ErrorMessage } from "../../components/ui/ErrorMessage";

import { getApiErrorMessage } from "../../shared/utils/getApiErrorMessage";
import { ROTA_PADRAO_POR_PERFIL, type Perfil } from "../../shared/constants/acessoPorPerfil";

import "./styles.css";

// é outro app (outra porta/domínio, outro login — não usa a tabela
// Usuario) — não dá pra linkar com <Link> do react-router, por isso é um
// <a> normal.
const PORTAL_FAMILIA_URL =
  import.meta.env.VITE_PORTAL_FAMILIA_URL ?? "http://localhost:5175";

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
      const usuario = await login(email, senha);
      navigate(ROTA_PADRAO_POR_PERFIL[usuario.perfil as Perfil] ?? "/alunos");
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
          <span className="login-brand-selo">SB</span>
          <h1>Sys Belt</h1>
          <p>Sistema Faixa Preta</p>
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

        <div className="login-portal-familia">
          <span>É responsável ou aluno?</span>
          <a href={PORTAL_FAMILIA_URL} target="_blank" rel="noopener noreferrer">
            Acesse o Portal da Família
          </a>
        </div>
      </div>
    </div>
  );
}
