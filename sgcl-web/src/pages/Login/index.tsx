import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../contexts/useAuth";

import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { ErrorMessage } from "../../components/ui/ErrorMessage";

import { SiteFooter } from "../../components/layout/SiteFooter";
import { getApiErrorMessage } from "../../shared/utils/getApiErrorMessage";
import { lerSessaoExpirada, limparSessaoExpirada } from "../../shared/utils/sessaoExpirada";
import { ROTA_PADRAO_POR_PERFIL, type Perfil } from "../../shared/constants/acessoPorPerfil";

import "./styles.css";

// é outro app (outra porta/domínio, outro login — não usa a tabela
// Usuario) — não dá pra linkar com <Link> do react-router, por isso é um
// <a> normal.
const PORTAL_FAMILIA_URL =
  import.meta.env.VITE_PORTAL_FAMILIA_URL ?? "http://localhost:5175";
const PORTAL_PROFESSOR_URL =
  import.meta.env.VITE_PORTAL_PROFESSOR_URL ?? "http://localhost:5176";

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setCarregando(true);
      setErro("");
      const resultado = await login(email, senha, desafio || undefined, codigo || undefined);
      if ("requerDoisFatores" in resultado) {
        setDesafio(resultado.desafio);
        return;
      }
      const usuario = resultado;
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
        </form>

        <div className="login-portais">
          <div className="login-portais-divisor">
            <span>Outros acessos</span>
          </div>

          <a className="login-portal-card" href={PORTAL_PROFESSOR_URL}
             target="_blank" rel="noopener noreferrer">
            <span className="login-portal-icone" aria-hidden="true">🥋</span>
            <span className="login-portal-texto">
              <strong>Portal do Professor</strong>
              <span>Para ministrar aulas pelo celular</span>
            </span>
            <span className="login-portal-seta" aria-hidden="true">›</span>
          </a>

          <a className="login-portal-card" href={PORTAL_FAMILIA_URL}
             target="_blank" rel="noopener noreferrer">
            <span className="login-portal-icone" aria-hidden="true">👨‍👩‍👦</span>
            <span className="login-portal-texto">
              <strong>Portal da Família</strong>
              <span>Para responsáveis e alunos</span>
            </span>
            <span className="login-portal-seta" aria-hidden="true">›</span>
          </a>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
