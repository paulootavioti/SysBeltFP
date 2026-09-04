import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../contexts/useAuth";

import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { ErrorMessage } from "../../components/ui/ErrorMessage";

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
    <main className="login-page">
      <section className="login-identity" aria-labelledby="login-brand-title">
        <div className="login-brand"><strong id="login-brand-title">SYS BELT</strong><span>Sistema Faixa Preta</span></div>
        <div className="login-brand-rule" aria-hidden="true" />
        <h1>Gestão que acompanha cada etapa da academia.</h1>
        <div className="login-provas"><p><strong>1</strong><span>sistema para toda a operação</span></p><p><strong>100%</strong><span>da jornada do aluno visível</span></p></div>
      </section>
      <section className="login-access">
        <div className="login-card">
        <header className="login-form-header"><span>Acesso administrativo</span><h2>{desafio ? "Confirmar identidade" : "Entrar"}</h2><p>{desafio ? "Digite o código enviado para concluir o acesso." : "Acesse a operação da sua academia."}</p></header>
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

          {!desafio && <Link className="login-link" to="/recuperar-senha">Esqueci minha senha</Link>}

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
          <div className="login-portais-divisor"><span>Outros acessos</span></div>

          <a className="login-portal-card" href={PORTAL_PROFESSOR_URL}
             target="_blank" rel="noopener noreferrer">
            <span className="login-portal-texto">
              <strong>Portal do Professor</strong>
              <span>Para ministrar aulas pelo celular</span>
            </span>
          </a>

          <a className="login-portal-card" href={PORTAL_FAMILIA_URL}
             target="_blank" rel="noopener noreferrer">
            <span className="login-portal-texto">
              <strong>Portal da Família</strong>
              <span>Para responsáveis e alunos</span>
            </span>
          </a>
        </div>
        </div>
      </section>
    </main>
  );
}
